import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { authenticateProductionDevice, getClientIp } from '@/lib/productionDeviceAuth';

const STAGE_ALIASES = ['is_stage', 'IS_STAGE'];
const COUNTER_ALIASES = ['counter_value', 'COUNTER_VALUE', 'result_amount', 'RESULT_AMOUNT'];
const ORDER_NO_ALIASES = ['p_order_no', 'P_ORDER_NO', 'order_no', 'ORDER_NO', 'order_code', 'ORDER_CODE'];
const LEGACY_ORDER_ID_ALIASES = ['p_order_id', 'P_ORDER_ID', 'order_id', 'ORDER_ID'];
const STATION_ID_ALIASES = ['station_id', 'STATION_ID'];

function firstPresent(source, keys) {
  return keys.find((key) => Object.prototype.hasOwnProperty.call(source, key));
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function writeProductionLog({ direction, ip, event, outcome, payload, error, details, logErrors }) {
  const logPayload = {
    direction,
    ip,
    payload: {
      integration: 'wex',
      domain: 'production',
      event,
      outcome,
      error: error || null,
      details: details || null,
      payload,
    },
  };

  const { error: logError } = await supabase.schema('production').from('logs').insert(logPayload);
  if (logError) {
    console.error('WEX log insert error:', logError);
    logErrors?.push(logError.message || 'Unknown log insert error');
  }
}

export async function POST(request) {
  let body = {};
  let ip = 'unknown';
  const logErrors = [];

  try {
    ip = getClientIp(request);
    body = await request.json();

    const configuredApiKey = process.env.WEX_API_KEY;
    const requestApiKey = request.headers.get('x-wex-api-key');
    const hasDeviceKey = Boolean(request.headers.get('x-device-key') || body.device_key || body.DEVICE_KEY);
    const hasValidGlobalApiKey = !configuredApiKey || requestApiKey === configuredApiKey;

    if (!hasDeviceKey && !hasValidGlobalApiKey) {
      return NextResponse.json({ success: false, error: 'Gecersiz API key.' }, { status: 401 });
    }

    const deviceAuth = await authenticateProductionDevice({ request, body, ip, supabase });

    if (!deviceAuth.ok && (hasDeviceKey || !hasValidGlobalApiKey)) {
      return NextResponse.json({ success: false, error: deviceAuth.error, logErrors }, { status: deviceAuth.status });
    }

    const deviceDetails = {
      auth_mode: deviceAuth.ok ? deviceAuth.authMode : 'wex-api-key',
      device: deviceAuth.device
        ? {
            id: deviceAuth.device.id,
            name: deviceAuth.device.device_name,
            machine_key: deviceAuth.device.machine_key,
          }
        : null,
      machine: deviceAuth.machine
        ? {
            id: deviceAuth.machine.id,
            code: deviceAuth.machine.machine_code,
            name: deviceAuth.machine.machine_name,
            machine_key: deviceAuth.machine.machine_key,
            station_id: deviceAuth.machine.station_id,
          }
        : null,
      machine_key: deviceAuth.machineKey || body.machine_key || body.MACHINE_KEY || null,
      station_id: deviceAuth.stationId,
    };

    await writeProductionLog({
      direction: 'incoming',
      ip,
      event: 'wex_signal_received',
      outcome: 'RECEIVED',
      payload: body,
      details: deviceDetails,
      logErrors,
    });

    const orderNoKey = firstPresent(body, ORDER_NO_ALIASES);
    const legacyOrderIdKey = firstPresent(body, LEGACY_ORDER_ID_ALIASES);
    const stationIdKey = firstPresent(body, STATION_ID_ALIASES);
    const stageKey = firstPresent(body, STAGE_ALIASES);
    const counterKey = firstPresent(body, COUNTER_ALIASES);

    const orderNo = orderNoKey ? String(body[orderNoKey]).trim() : '';
    const legacyOrderId = legacyOrderIdKey ? numberOrNull(body[legacyOrderIdKey]) : null;
    const stationId = stationIdKey ? numberOrNull(body[stationIdKey]) : deviceAuth.stationId;

    const updatePayload = {};

    if (stageKey) {
      const stage = numberOrNull(body[stageKey]);
      if (stage === null) {
        await writeProductionLog({
          direction: 'outgoing',
          ip,
          event: 'production_order_update',
          outcome: 'FAILED',
          error: 'Invalid is_stage value',
          payload: body,
          details: deviceDetails,
          logErrors,
        });
        return NextResponse.json({ success: false, error: 'is_stage sayisal olmali.', logErrors }, { status: 400 });
      }
      updatePayload.is_stage = stage;
    }

    if (counterKey) {
      const counterValue = numberOrNull(body[counterKey]);
      if (counterValue === null) {
        await writeProductionLog({
          direction: 'outgoing',
          ip,
          event: 'production_order_update',
          outcome: 'FAILED',
          error: 'Invalid counter_value value',
          payload: body,
          details: deviceDetails,
          logErrors,
        });
        return NextResponse.json({ success: false, error: 'counter_value sayisal olmali.', logErrors }, { status: 400 });
      }
      updatePayload.counter_value = counterValue;
    }

    if (Object.keys(updatePayload).length === 0) {
      await writeProductionLog({
        direction: 'outgoing',
        ip,
        event: 'production_order_update',
        outcome: 'FAILED',
        error: 'No updatable fields',
        payload: body,
        details: deviceDetails,
        logErrors,
      });
      return NextResponse.json(
        { success: false, error: 'Guncellenecek alan bulunamadi. is_stage veya counter_value gonderin.', logErrors },
        { status: 400 },
      );
    }

    let query = supabase
      .schema('production')
      .from('production_orders')
      .update(updatePayload);

    if (orderNo) {
      query = query.ilike('p_order_no', orderNo);
    } else if (legacyOrderId !== null) {
      query = query.eq('p_order_id', legacyOrderId);
    } else {
      await writeProductionLog({
        direction: 'outgoing',
        ip,
        event: 'production_order_update',
        outcome: 'FAILED',
        error: 'Missing order identifier',
        payload: body,
        details: deviceDetails,
        logErrors,
      });
      return NextResponse.json(
        { success: false, error: 'p_order_no gonderilmeli.', logErrors },
        { status: 400 },
      );
    }

    if (stationId !== null) query = query.eq('station_id', stationId);

    const { data, error } = await query.select('p_order_id,p_order_no,station_id,is_stage,counter_value');

    if (error) {
      console.error('WEX production order update error:', error);
      await writeProductionLog({
        direction: 'outgoing',
        ip,
        event: 'production_order_update',
        outcome: 'FAILED',
        error: error.message,
        payload: body,
        details: deviceDetails,
        logErrors,
      });
      return NextResponse.json({ success: false, error: error.message, logErrors }, { status: 500 });
    }

    if (!data || data.length === 0) {
      const criteria = {
        p_order_no: orderNo || null,
        legacy_p_order_id: legacyOrderId,
        station_id: stationId,
      };
      await writeProductionLog({
        direction: 'outgoing',
        ip,
        event: 'production_order_update',
        outcome: 'FAILED',
        error: 'No matching order',
        payload: body,
        details: { ...deviceDetails, criteria },
        logErrors,
      });
      return NextResponse.json(
        { success: false, error: 'Eslesen uretim emri bulunamadi.', criteria, logErrors },
        { status: 404 },
      );
    }

    await writeProductionLog({
      direction: 'outgoing',
      ip,
      event: 'production_order_update',
      outcome: 'SUCCESS',
      payload: body,
      details: {
        ...deviceDetails,
        update: updatePayload,
        updated_rows: data,
      },
      logErrors,
    });

    return NextResponse.json({
      success: true,
      updatedCount: data.length,
      updatedRows: data,
      logErrors,
    });
  } catch (err) {
    console.error('WEX route error:', err);
    await writeProductionLog({
      direction: 'outgoing',
      ip,
      event: 'production_order_update',
      outcome: 'FAILED',
      error: err.message,
      payload: body,
      logErrors,
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error', logErrors }, { status: 500 });
  }
}
