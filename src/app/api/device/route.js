import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { authenticateProductionDevice, getClientIp } from '@/lib/productionDeviceAuth';

function normalizeOrderPayload(order, deviceAuth) {
  return {
    P_ORDER_NO: order.p_order_no,
    PRODUCT_NAME2: order.product_name2,
    LOT_NO: order.lot_no,
    STATION_ID: order.station_id,
    MACHINE_KEY: deviceAuth.machineKey,
    QUANTITY: order.quantity,
    IS_STAGE: 0,
  };
}

export async function GET(request) {
  const ip = getClientIp(request);
  const configuredApiKey = process.env.WEX_API_KEY;
  const requestApiKey = request.headers.get('x-wex-api-key');
  const hasDeviceKey = Boolean(request.headers.get('x-device-key'));
  const hasValidGlobalApiKey = !configuredApiKey || requestApiKey === configuredApiKey;

  if (!hasDeviceKey && !hasValidGlobalApiKey) {
    return NextResponse.json({ success: false, error: 'Gecersiz API key.' }, { status: 401 });
  }

  const deviceAuth = await authenticateProductionDevice({ request, body: {}, ip, supabase });

  if (!deviceAuth.ok && (hasDeviceKey || !hasValidGlobalApiKey)) {
    return NextResponse.json({ success: false, error: deviceAuth.error }, { status: deviceAuth.status });
  }

  let query = supabase
    .schema('production')
    .from('production_orders')
    .select('p_order_id,p_order_no,product_name2,lot_no,station_id,quantity,is_stage')
    .eq('is_stage', 4)
    .order('p_order_id', { ascending: true })
    .limit(1);

  if (deviceAuth.stationId !== null && deviceAuth.stationId !== undefined) {
    query = query.eq('station_id', deviceAuth.stationId);
  }

  const { data: orders, error: fetchErr } = await query;

  if (fetchErr) {
    return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ success: true, message: 'No pending orders', device: deviceAuth.machineKey || null });
  }

  const order = orders[0];

  const { error: updateErr } = await supabase
    .schema('production')
    .from('production_orders')
    .update({ is_stage: 0, prod_order_stage: 0 })
    .eq('p_order_id', order.p_order_id);

  if (updateErr) {
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    device: deviceAuth.machineKey || null,
    order: normalizeOrderPayload(order, deviceAuth),
  });
}
