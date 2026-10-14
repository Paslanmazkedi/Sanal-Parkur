import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { OPERATOR_ACTIONS } from '@/lib/operatorConstants';

export async function fetchOrderForStation(pOrderId, stationId) {
  const { data, error } = await supabase
    .schema('production')
    .from('production_orders')
    .select('p_order_id,p_order_no,product_name2,lot_no,quantity,counter_value,station_id,is_stage')
    .eq('p_order_id', pOrderId)
    .eq('station_id', stationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Uretim emri bulunamadi veya istasyon eslesmiyor.');
  return data;
}

export async function logOperatorAction({ pOrderId, stationId, actionType, fromStage, toStage, actorUserId, metadata }) {
  const { error } = await supabase.schema('production').from('operator_actions').insert({
    p_order_id: pOrderId,
    station_id: stationId,
    action_type: actionType,
    from_stage: fromStage,
    to_stage: toStage,
    actor_user_id: actorUserId,
    metadata: metadata || {},
  });

  if (error) {
    console.error('operator_actions insert error:', error);
  }
}

export async function applyStageAction({
  action,
  pOrderId,
  stationId,
  actorUserId,
  pauseTypeId = null,
  pauseDetail = null,
  clientIp = null,
}) {
  const config = OPERATOR_ACTIONS[action];
  if (!config) throw new Error('Gecersiz aksiyon.');

  const order = await fetchOrderForStation(pOrderId, stationId);
  const currentStage = Number(order.is_stage);

  if (!config.fromStages.includes(currentStage)) {
    throw new Error(`${config.label} aksiyonu mevcut durum (${currentStage}) icin uygun degil.`);
  }

  if (action === 'pause') {
    if (currentStage === 3) {
      throw new Error('Bu emir zaten duraklatildi.');
    }
    const typeId = Number(pauseTypeId);
    if (!Number.isFinite(typeId) || typeId <= 0) {
      throw new Error('Duraklatmak icin duraklama tipi secin.');
    }
  }

  if (action === 'start') {
    const { data: runningRows, error: runningError } = await supabase
      .schema('production')
      .from('production_orders')
      .select('p_order_id,p_order_no')
      .eq('station_id', stationId)
      .eq('is_stage', 1)
      .neq('p_order_id', pOrderId)
      .limit(1);

    if (runningError) throw new Error(runningError.message);

    const blocking = runningRows?.[0];
    if (blocking) {
      throw new Error(
        `Bu istasyonda ${blocking.p_order_no || `#${blocking.p_order_id}`} zaten üretimde. Önce duraklatın veya sonuç girin.`,
      );
    }
  }

  if (action === 'start' && currentStage === 3) {
    await closeOpenProdPauses({ pOrderId, stationId, updateIp: clientIp });
  }

  const updatePayload = {
    is_stage: config.toStage,
    prod_order_stage: config.toStage,
  };

  const { data, error } = await supabase
    .schema('production')
    .from('production_orders')
    .update(updatePayload)
    .eq('p_order_id', pOrderId)
    .eq('station_id', stationId)
    .select('p_order_id,p_order_no,station_id,is_stage,counter_value')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Emir guncellenemedi.');

  if (action === 'pause') {
    await openProdPause({
      pOrderId,
      stationId,
      typeId: Number(pauseTypeId),
      detail: pauseDetail,
      recordIp: clientIp,
    });
  }

  await logOperatorAction({
    pOrderId,
    stationId,
    actionType: action,
    fromStage: currentStage,
    toStage: config.toStage,
    actorUserId,
    metadata:
      action === 'pause'
        ? { prod_pause_type_id: Number(pauseTypeId), prod_detail: pauseDetail || null }
        : {},
  });

  await supabase.schema('production').from('station_events').insert({
    station_id: stationId,
    p_order_id: pOrderId,
    event_type: action === 'pause' ? 'run_stop' : action === 'start' ? 'run_start' : action,
    metadata: { from_stage: currentStage, to_stage: config.toStage },
  }).then(({ error: eventError }) => {
    if (eventError) console.error('station_events insert error:', eventError);
  });

  return data;
}

async function openProdPause({ pOrderId, stationId, typeId, detail, recordIp }) {
  const { data: typeRow, error: typeError } = await supabase
    .schema('production')
    .from('setup_prod_pause_types')
    .select('prod_pause_type_id, pause_detail, prod_pause_cat_id, is_active')
    .eq('prod_pause_type_id', typeId)
    .maybeSingle();

  if (typeError) throw new Error(typeError.message);
  if (!typeRow || typeRow.is_active === false) {
    throw new Error('Duraklama tipi bulunamadi veya pasif.');
  }

  let isWorkingTime = null;
  if (typeRow.prod_pause_cat_id != null) {
    const { data: catRow } = await supabase
      .schema('production')
      .from('setup_prod_pause_cat')
      .select('is_working_time')
      .eq('prod_pause_cat_id', typeRow.prod_pause_cat_id)
      .maybeSingle();
    if (catRow && typeof catRow.is_working_time === 'boolean') {
      isWorkingTime = catRow.is_working_time;
    }
  }

  const now = new Date().toISOString();
  const note = String(detail || typeRow.pause_detail || '').trim().slice(0, 250) || null;

  const { error } = await supabase.schema('production').from('setup_prod_pause').insert({
    prod_pause_type_id: typeId,
    prod_detail: note,
    is_working_time: isWorkingTime,
    pr_order_id: null,
    action_date: now,
    record_date: now,
    record_ip: recordIp || null,
    duration_start_date: now,
    station_id: stationId,
    p_order_id: pOrderId,
    source: 'operator',
  });

  if (error) throw new Error(error.message);
}

async function closeOpenProdPauses({ pOrderId, stationId, updateIp }) {
  const { data: openRows, error: findError } = await supabase
    .schema('production')
    .from('setup_prod_pause')
    .select('prod_pause_id, duration_start_date')
    .eq('p_order_id', pOrderId)
    .eq('station_id', stationId)
    .is('duration_finish_date', null);

  if (findError) throw new Error(findError.message);
  if (!openRows?.length) return;

  const now = new Date();
  const nowIso = now.toISOString();

  for (const row of openRows) {
    const start = new Date(row.duration_start_date).getTime();
    const prodDuration = Number.isFinite(start)
      ? Math.max(0, Math.round((now.getTime() - start) / 60000))
      : null;

    const { error } = await supabase
      .schema('production')
      .from('setup_prod_pause')
      .update({
        duration_finish_date: nowIso,
        prod_duration: prodDuration,
        update_date: nowIso,
        update_ip: updateIp || null,
      })
      .eq('prod_pause_id', row.prod_pause_id);

    if (error) throw new Error(error.message);
  }
}

export function normalizeBasketLines(lines = [], basketType) {
  return lines
    .map((line, index) => ({
      basket_type: basketType,
      stock_code: String(line.stock_code || '').trim() || null,
      product_name: String(line.product_name || '').trim() || null,
      spec: String(line.spec || '').trim() || null,
      lot_no: String(line.lot_no || '').trim() || null,
      serial_no: String(line.serial_no || '').trim() || null,
      quantity: Number(line.quantity) || 0,
      unit: String(line.unit || 'Adet').trim() || 'Adet',
      sort_order: index,
    }))
    .filter(
      (line) =>
        line.quantity > 0 ||
        line.stock_code ||
        line.product_name ||
        line.lot_no ||
        line.serial_no,
    );
}

export function normalizeTimeLines(lines = []) {
  return lines
    .map((line) => ({
      operator_id: line.operator_id || null,
      operator_name: String(line.operator_name || '').trim(),
      minutes_spent: Number(line.minutes_spent),
    }))
    .filter((line) => line.operator_name && line.minutes_spent > 0);
}
