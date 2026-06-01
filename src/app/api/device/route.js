// Next.js Route Handler for IoT Gateway integration// This endpoint returns the first pending production order with is_stage = 4 (Başlamadı)
// and marks it as sent by updating is_stage and prod_order_stage to 0 (Operatöre Gönderildi).
// It returns a JSON payload with uppercase keys matching Workcube standards.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  // Find the first order with is_stage = 4 (Başlamadı)
  const { data: orders, error: fetchErr } = await supabase    .from('production_orders')
    .select('*, workstations!inner(asset_id)')
    .eq('is_stage', 4)
    .order('p_order_id', { ascending: true })
    .limit(1);

  if (fetchErr || !orders || orders.length === 0) {
    return new Response(JSON.stringify({ message: 'No pending orders' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const order = orders[0];
  const stationAsset = order.workstations?.asset_id ?? null;

  // Update status to SENT_TO_DEVICE (is_stage = 0 and prod_order_stage = 0)
  const { error: updateErr } = await supabase
    .from('production_orders')
    .update({ is_stage: 0, prod_order_stage: 0 })
    .eq('p_order_id', order.p_order_id);

  if (updateErr) {
    return new Response(JSON.stringify({ error: 'Failed to update status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return a clean JSON payload with uppercase keys matching Workcube standards
  const payload = {
    P_ORDER_ID: order.p_order_id,
    P_ORDER_NO: order.p_order_no,
    PRODUCT_NAME2: order.product_name2,
    LOT_NO: order.lot_no,
    STATION_ID: order.station_id,
    ASSET_ID: stationAsset,
    QUANTITY: order.quantity,
    IS_STAGE: 0,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}