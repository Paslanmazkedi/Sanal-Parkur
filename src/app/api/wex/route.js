import { supabase } from '../../supabase';

/**
 * POST /api/wex
 * Expected body:
 * {
 *   p_order_id: number,
 *   asset_id: number,
 *   status_code: string,   // RUNNING, PAUSED, COMPLETED
 *   counter_value: number
 * }
 */
export async function POST(request) {
  // Verify API key from header
  const apiKey = request.headers.get('x-wex-api-key');
  if (!apiKey || apiKey !== process.env.WEX_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Geçersiz veya eksik API Key!" }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
const {
  p_order_id,
  asset_id,
  status_code,
  counter_value,
} = await request.json();

if (
  typeof p_order_id !== 'number' ||
  typeof asset_id !== 'number' ||
  typeof status_code !== 'string' ||
  typeof counter_value !== 'number'
) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid payload',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1️⃣ Update production_orders
    const { data: order, error: orderError } = await supabase
      .from('production_orders')
      .select('*')
      .eq('p_order_id', p_order_id)
      .single();

    if (orderError) {
      console.error('Supabase order fetch error:', orderError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Order not found',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

let newStage = order.is_stage;
const updates = {};

if (status_code === 'RUNNING') {
  newStage = 1; // Devam Ediyor
} else if (status_code === 'PAUSED') {
  newStage = 2; // Duraklatıldı
} else if (status_code === 'COMPLETED') {
  newStage = 3; // Tamamlandı
  updates.finish_date_real = new Date().toISOString();
}

// Update result_amount (replace or add)
updates.result_amount = counter_value;

// Apply stage change
updates.is_stage = newStage;

    const { error: updateError } = await supabase
      .from('production_orders')
      .update(updates)
      .eq('p_order_id', p_order_id);

    if (updateError) {
      console.error('Supabase order update error:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to update order',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2️⃣ Insert log into production_order_operations (or fallback table)
const logTable = 'production_order_operations';
const { error: logError } = await supabase.from(logTable).insert([
  {
    p_order_id,
    asset_id,
    status_code,
    counter_value,
    created_at: new Date().toISOString(),
  },
]);

    if (logError) {
      console.error('Supabase log insert error:', logError);
      // Continue – the main update succeeded, but log failed
    }

    // 3️⃣ Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Workcube ERP updated successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error in WEX route:', err);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}