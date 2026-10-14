const MACHINE_STATUS_LABELS = {
  0: 'Duruyor',
  1: 'Otomatikte bekliyor',
  2: 'Çalışıyor',
};

const LIVE_PAYLOAD_KEYS = [
  'POWER_1',
  'POWER_2',
  'POWER_3',
  'POWER_4',
  'POWER_5',
  'POWER_6',
  'SPOT_TIME',
  'COOL_TIME',
  'TRAFO_TIME',
  'MACHINE_SPEED',
];

function firstPresent(source, keys) {
  return keys.find((key) => source && Object.prototype.hasOwnProperty.call(source, key));
}

export function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function idOrNull(value) {
  const parsed = numberOrNull(value);
  if (parsed === null || parsed === 0) return null;
  return parsed;
}

export function getMachineStatusLabel(status) {
  if (status === null || status === undefined) return 'Sinyal yok';
  return MACHINE_STATUS_LABELS[Number(status)] || `Durum ${status}`;
}

export function extractSignals(body) {
  if (!body || typeof body !== 'object') return {};
  if (body.signals && typeof body.signals === 'object') return body.signals;
  return body;
}

export function buildSpStationRow({ stationId, deviceId, body }) {
  const signals = extractSignals(body);
  const overallKey = firstPresent(signals, ['OVERALL_COUNT', 'overall_count']);
  const statusKey = firstPresent(signals, ['MACHINE_STATUS', 'machine_status']);
  const plcOrderKey = firstPresent(signals, ['P_ORDER_ID', 'p_order_id', 'plc_p_order_id']);
  const queueOrderKey = firstPresent(signals, ['QUEUE_P_ORDER_ID', 'queue_p_order_id']);
  const queueQtyKey = firstPresent(signals, ['QUEUE_QUANTITY', 'queue_quantity']);

  const machineStatus = statusKey ? numberOrNull(signals[statusKey]) : null;
  const safeStatus = [0, 1, 2].includes(machineStatus) ? machineStatus : null;

  const readAt = body.read_at || body.READ_AT || new Date().toISOString();

  return {
    station_id: stationId,
    device_id: deviceId || null,
    overall_count: overallKey ? numberOrNull(signals[overallKey]) : null,
    machine_status: safeStatus,
    plc_p_order_id: plcOrderKey ? idOrNull(signals[plcOrderKey]) : null,
    queue_p_order_id: queueOrderKey ? idOrNull(signals[queueOrderKey]) : null,
    queue_quantity: queueQtyKey ? numberOrNull(signals[queueQtyKey]) : null,
    read_at: readAt,
    payload: { read_at: readAt, signals },
    updated_at: new Date().toISOString(),
  };
}

export function livePayloadRows(payload) {
  const signals = payload?.signals && typeof payload.signals === 'object' ? payload.signals : payload || {};
  return LIVE_PAYLOAD_KEYS.filter((key) => signals[key] !== undefined && signals[key] !== null).map((key) => ({
    key,
    value: signals[key],
  }));
}
