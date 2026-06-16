import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { authenticateProductionDevice, getClientIp } from '@/lib/productionDeviceAuth';

function parseStationId(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveStationId(request, deviceAuth) {
  if (deviceAuth.stationId !== null && deviceAuth.stationId !== undefined) {
    return deviceAuth.stationId;
  }

  const stationId = parseStationId(new URL(request.url).searchParams.get('station_id'));
  if (stationId === null) return null;

  const configuredApiKey = process.env.WEX_API_KEY;
  const requestApiKey = request.headers.get('x-wex-api-key');
  const hasValidGlobalApiKey = !configuredApiKey || requestApiKey === configuredApiKey;

  if (!hasValidGlobalApiKey) return null;
  return stationId;
}

export async function GET(request) {
  const ip = getClientIp(request);
  const deviceAuth = await authenticateProductionDevice({ request, body: {}, ip, supabase });

  if (!deviceAuth.ok) {
    return NextResponse.json({ success: false, error: deviceAuth.error }, { status: deviceAuth.status });
  }

  const stationId = await resolveStationId(request, deviceAuth);
  if (stationId === null) {
    return NextResponse.json(
      { success: false, error: 'Istasyon cozulemedi. device_key veya station_id + API key gonderin.' },
      { status: 400 },
    );
  }

  const { data: workstation, error: workstationError } = await supabase
    .schema('production')
    .from('workstations')
    .select('station_id,station_name,branch,department,active,capacity')
    .eq('station_id', stationId)
    .maybeSingle();

  if (workstationError) {
    return NextResponse.json({ success: false, error: workstationError.message }, { status: 500 });
  }

  let machine = deviceAuth.machine;
  if (!machine) {
    const { data: machineData } = await supabase
      .schema('production')
      .from('machines')
      .select('id,machine_code,machine_name,machine_key,station_id,status')
      .eq('station_id', stationId)
      .neq('status', 'offline')
      .limit(1)
      .maybeSingle();
    machine = machineData ?? null;
  }

  return NextResponse.json({
    success: true,
    authMode: deviceAuth.authMode,
    stationId,
    workstation: workstation ?? null,
    machine,
    device: deviceAuth.device
      ? {
          id: deviceAuth.device.id,
          device_name: deviceAuth.device.device_name,
          machine_key: deviceAuth.device.machine_key,
        }
      : null,
  });
}
