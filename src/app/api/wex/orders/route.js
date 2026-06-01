1 | import { supabase } from '../../supabase';

/**
 * GET /api/wex/orders
 * Returns pending or active production orders.
 * Fields: p_order_id, order_code, product_name, target_amount
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('production_orders')
      .select('p_order_id, order_code, product_name, target_amount, is_stage')
      .in('is_stage', [0, 1]); // 0 = waiting, 1 = active (adjust if different)

    if (error) {
      console.error('Supabase fetch error:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to fetch orders' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Filter only waiting (stage 0) or active (stage 1)
    const filtered = data.filter(
      (o) => o.is_stage === 0 || o.is_stage === 1
    );

    return new Response(
      JSON.stringify({ success: true, orders: filtered }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error in WEX orders route:', err);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}