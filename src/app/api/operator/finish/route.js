import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';
import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { canPerformAction } from '@/lib/operatorConstants';
import {
  fetchOrderForStation,
  logOperatorAction,
  normalizeBasketLines,
} from '@/lib/operatorServer';

export async function POST(request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.user) return unauthorizedResponse(auth.error);

  try {
    const body = await request.json();
    const pOrderId = Number(body.p_order_id);
    const stationId = Number(body.station_id);
    const notes = String(body.notes || '').trim() || null;

    if (!Number.isFinite(pOrderId) || !Number.isFinite(stationId)) {
      return NextResponse.json(
        { success: false, error: 'p_order_id ve station_id zorunludur.' },
        { status: 400 },
      );
    }

    const order = await fetchOrderForStation(pOrderId, stationId);

    if (!canPerformAction('finish', order.is_stage)) {
      return NextResponse.json(
        { success: false, error: 'Bitir aksiyonu mevcut emir durumu icin uygun degil.' },
        { status: 400 },
      );
    }

    const produced = normalizeBasketLines(body.produced || [], 'produced');
    const consumed = normalizeBasketLines(body.consumed || [], 'consumed');
    const scrap = normalizeBasketLines(body.scrap || [], 'scrap');
    const allLines = [...produced, ...consumed, ...scrap];

    if (produced.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bitir islemi icin en az bir uretilen satir girilmelidir.' },
        { status: 400 },
      );
    }

    const { data: report, error: reportError } = await supabase
      .schema('production')
      .from('order_finish_reports')
      .insert({
        p_order_id: pOrderId,
        station_id: stationId,
        notes,
        created_by: auth.user.id,
      })
      .select('id')
      .single();

    if (reportError) {
      return NextResponse.json({ success: false, error: reportError.message }, { status: 500 });
    }

    if (allLines.length > 0) {
      const rows = allLines.map((line) => ({
        report_id: report.id,
        ...line,
      }));

      const { error: linesError } = await supabase
        .schema('production')
        .from('order_finish_lines')
        .insert(rows);

      if (linesError) {
        return NextResponse.json({ success: false, error: linesError.message }, { status: 500 });
      }
    }

    const producedQty = produced.reduce((sum, line) => sum + line.quantity, 0);
    const scrapQty = scrap.reduce((sum, line) => sum + line.quantity, 0);

    const updatePayload = {
      is_stage: 2,
      prod_order_stage: 2,
    };

    if (producedQty > 0) {
      updatePayload.counter_value = producedQty;
      updatePayload.result_amount = producedQty;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .schema('production')
      .from('production_orders')
      .update(updatePayload)
      .eq('p_order_id', pOrderId)
      .eq('station_id', stationId)
      .select('p_order_id,p_order_no,station_id,is_stage,counter_value,result_amount')
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    await logOperatorAction({
      pOrderId,
      stationId,
      actionType: 'finish',
      fromStage: Number(order.is_stage),
      toStage: 2,
      actorUserId: auth.user.id,
      metadata: {
        report_id: report.id,
        produced_lines: produced.length,
        consumed_lines: consumed.length,
        scrap_lines: scrap.length,
        produced_qty: producedQty,
        scrap_qty: scrapQty,
      },
    });

    await supabase.schema('production').from('station_events').insert({
      station_id: stationId,
      p_order_id: pOrderId,
      event_type: 'finish',
      metadata: { report_id: report.id, produced_qty: producedQty, scrap_qty: scrapQty },
    }).then(({ error }) => {
      if (error) console.error('station_events insert error:', error);
    });

    return NextResponse.json({
      success: true,
      report_id: report.id,
      order: updatedOrder,
      summary: {
        produced_lines: produced.length,
        consumed_lines: consumed.length,
        scrap_lines: scrap.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
