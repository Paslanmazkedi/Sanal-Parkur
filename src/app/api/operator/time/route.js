import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';
import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { fetchOrderForStation, logOperatorAction, normalizeTimeLines } from '@/lib/operatorServer';

export async function POST(request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.user) return unauthorizedResponse(auth.error);

  try {
    const body = await request.json();
    const pOrderId = Number(body.p_order_id);
    const stationId = Number(body.station_id);
    const entryDate = body.entry_date || new Date().toISOString().slice(0, 10);
    const notes = String(body.notes || '').trim() || null;
    const lines = normalizeTimeLines(body.lines || []);

    if (!Number.isFinite(pOrderId) || !Number.isFinite(stationId)) {
      return NextResponse.json(
        { success: false, error: 'p_order_id ve station_id zorunludur.' },
        { status: 400 },
      );
    }

    if (lines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'En az bir personel ve sure girilmelidir.' },
        { status: 400 },
      );
    }

    await fetchOrderForStation(pOrderId, stationId);

    const { data: entry, error: entryError } = await supabase
      .schema('production')
      .from('order_time_entries')
      .insert({
        p_order_id: pOrderId,
        station_id: stationId,
        entry_date: entryDate,
        notes,
        created_by: auth.user.id,
      })
      .select('id')
      .single();

    if (entryError) {
      return NextResponse.json({ success: false, error: entryError.message }, { status: 500 });
    }

    const lineRows = lines.map((line) => ({
      entry_id: entry.id,
      operator_id: line.operator_id,
      operator_name: line.operator_name,
      minutes_spent: line.minutes_spent,
    }));

    const { error: linesError } = await supabase
      .schema('production')
      .from('order_time_entry_lines')
      .insert(lineRows);

    if (linesError) {
      return NextResponse.json({ success: false, error: linesError.message }, { status: 500 });
    }

    await logOperatorAction({
      pOrderId,
      stationId,
      actionType: 'time_entry',
      fromStage: null,
      toStage: null,
      actorUserId: auth.user.id,
      metadata: { entry_id: entry.id, line_count: lineRows.length, total_minutes: lines.reduce((s, l) => s + l.minutes_spent, 0) },
    });

    return NextResponse.json({
      success: true,
      entry_id: entry.id,
      line_count: lineRows.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
