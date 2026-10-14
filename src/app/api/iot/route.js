import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { authenticateProductionDevice, getClientIp, getDeviceKey } from '@/lib/productionDeviceAuth';
import { buildSpStationRow, numberOrNull } from '@/lib/iotStation';
import { trimProductionLogs } from '@/lib/trimProductionLogs';

function stationIdFromBody(body) {
  const raw = body.station_id ?? body.STATION_ID;
  return numberOrNull(raw);
}

async function writeIotLog({ direction, ip, event, outcome, payload, error, details }) {
  const { error: logError } = await supabase.schema('production').from('logs').insert({
    direction,
    ip,
    payload: {
      integration: 'iot',
      domain: 'production',
      event,
      outcome,
      error: error || null,
      details: details || null,
      payload,
    },
  });
  if (logError) {
    console.error('IoT log insert error:', logError);
    return;
  }
  await trimProductionLogs(supabase);
}

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Gecersiz JSON.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const configuredApiKey = process.env.WEX_API_KEY;
  const requestApiKey = request.headers.get('x-wex-api-key');
  const deviceKey = getDeviceKey(request, body);
  const hasValidGlobalApiKey = !configuredApiKey || requestApiKey === configuredApiKey;

  let deviceAuth = {
    ok: true,
    authMode: 'wex-api-key',
    device: null,
    stationId: null,
  };

  if (deviceKey && hasValidGlobalApiKey) {
    const lookedUp = await authenticateProductionDevice({ request, body, ip, supabase });
    if (lookedUp.ok && lookedUp.authMode === 'device-key') {
      deviceAuth = lookedUp;
    }
  } else if (deviceKey && !hasValidGlobalApiKey) {
    const lookedUp = await authenticateProductionDevice({ request, body, ip, supabase });
    if (!lookedUp.ok) {
      return NextResponse.json({ success: false, error: lookedUp.error }, { status: lookedUp.status || 401 });
    }
    deviceAuth = lookedUp;
  } else if (!hasValidGlobalApiKey) {
    return NextResponse.json({ success: false, error: 'Gecersiz API key.' }, { status: 401 });
  }

  const stationId = deviceAuth.stationId ?? stationIdFromBody(body);
  if (!Number.isFinite(stationId) || stationId <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'station_id gerekli (JSON) veya kayitli x-device-key ile istasyon cozulmeli.',
      },
      { status: 400 },
    );
  }

  const row = buildSpStationRow({
    stationId,
    deviceId: deviceAuth.device?.id || null,
    body,
  });

  const { data, error } = await supabase.schema('production').from('sp_station').upsert(row, { onConflict: 'station_id' }).select().maybeSingle();

  if (error) {
    await writeIotLog({
      direction: 'outgoing',
      ip,
      event: 'iot_station_upsert',
      outcome: 'FAILED',
      payload: body,
      error: error.message,
      details: { station_id: stationId },
    });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await writeIotLog({
    direction: 'incoming',
    ip,
    event: 'iot_station_upsert',
    outcome: 'SUCCESS',
    payload: body,
    details: { station_id: stationId, overall_count: row.overall_count, machine_status: row.machine_status },
  });

  return NextResponse.json({
    success: true,
    station_id: stationId,
    row: data,
  });
}
