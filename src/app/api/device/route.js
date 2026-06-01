// Next.js Route Handler for IoT Gateway integration
// This endpoint returns the first pending production order and marks it as sent.
// It is intentionally minimal and stateless – the gateway simply polls this
// endpoint to fetch the next order.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  // Find the first order with status 'PENDING'
  const { data: orders, error: fetchErr } = await supabase
    .from('production_orders')
    .select('*')
    .eq('status', 'PENDING')
    .order('id', { ascending: true })
    .limit(1);

  if (fetchErr || !orders || orders.length === 0) {
    return new Response(JSON.stringify({ message: 'No pending orders' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const order = orders[0];

  // Update status to SENT_TO_DEVICE
  const { error: updateErr } = await supabase
    .from('production_orders')
    .update({ status: 'SENT_TO_DEVICE' })
    .eq('id', order.id);

  if (updateErr) {
    return new Response(JSON.stringify({ error: 'Failed to update status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return a clean JSON payload
  const payload = {
    id: order.id,
    order_code: order.order_code,
    station_id: order.station_id,
    status: 'SENT_TO_DEVICE',
    total_qty: order.total_qty,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
