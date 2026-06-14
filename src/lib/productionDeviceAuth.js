export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
}

export function getDeviceKey(request, body = {}) {
  return request.headers.get('x-device-key') || body.device_key || body.DEVICE_KEY || '';
}

export function getMachineKey(request, body = {}) {
  return request.headers.get('x-machine-key') || body.machine_key || body.MACHINE_KEY || '';
}

export async function authenticateProductionDevice({ request, body, ip, supabase }) {
  const deviceKey = getDeviceKey(request, body);
  const fallbackMachineKey = getMachineKey(request, body);

  if (!deviceKey) {
    return {
      ok: true,
      authMode: 'wex-api-key',
      device: null,
      machineKey: fallbackMachineKey || null,
      stationId: null,
    };
  }

  const { data, error } = await supabase
    .schema('production')
    .from('integration_devices')
    .select('id,device_name,machine_key,is_active,allowed_ip')
    .eq('device_key', deviceKey)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 500,
      error: `Cihaz dogrulama tablosu okunamadi: ${error.message}`,
    };
  }

  if (!data || data.is_active === false) {
    return {
      ok: false,
      status: 401,
      error: 'Cihaz tanimli degil veya pasif.',
    };
  }

  if (data.allowed_ip && data.allowed_ip !== ip) {
    return {
      ok: false,
      status: 403,
      error: 'Cihaz IP adresi yetkili degil.',
    };
  }

  const machineKey = data.machine_key || fallbackMachineKey || null;
  let machine = null;

  if (machineKey) {
    const { data: machineData, error: machineError } = await supabase
      .schema('production')
      .from('machines')
      .select('id,machine_code,machine_name,machine_key,station_id,status')
      .eq('machine_key', machineKey)
      .maybeSingle();

    if (machineError) {
      return {
        ok: false,
        status: 500,
        error: `Makine eslestirmesi okunamadi: ${machineError.message}`,
      };
    }

    if (!machineData || machineData.status === 'offline') {
      return {
        ok: false,
        status: 403,
        error: 'Cihaza bagli makine bulunamadi veya aktif degil.',
      };
    }

    machine = machineData;
  }

  await supabase
    .schema('production')
    .from('integration_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    ok: true,
    authMode: 'device-key',
    device: data,
    machine,
    machineKey,
    stationId: machine?.station_id ?? null,
  };
}
