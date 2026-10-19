const MACHINE_STATUS_LABELS = {
  0: 'Duruyor',
  1: 'Otomatikte bekliyor',
  2: 'Çalışıyor',
};

const LIVE_PAYLOAD_KEYS = [
  'OVERALL_COUNT',
  'POWER_1',
  'POWER_2',
  'POWER_3',
  'POWER_4',
  'POWER_5',
  'POWER_6',
  'SPOT_TIME',
  'COOL_TIME',
  'TRAFO_TIME',
  'CYCLE_TIME',
];

const COUNTER_SIGNAL_KEYS = ['COUNTER_VALUE', 'counter_value'];
const SLOT_SIGNAL_KEYS = ['SLOT_COUNT', 'slot_count'];
const ACTIVE_SLOT_SIGNAL_KEYS = ['ACTIVE_SLOT_COUNT', 'active_slot_count'];
const SPEED_SIGNAL_KEYS = ['MACHINE_SPEED', 'machine_speed'];
const CYCLE_SIGNAL_KEYS = ['CYCLE_TIME', 'cycle_time', 'CYCLE_SEC', 'cycle_sec', 'CEVRIM_SURESI'];

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

function signalFrom(signals, keys) {
  const key = firstPresent(signals, keys);
  return key ? numberOrNull(signals[key]) : null;
}

export function buildSpStationRow({ stationId, deviceId, body }) {
  const signals = extractSignals(body);
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
    overall_count: signalFrom(signals, ['OVERALL_COUNT', 'overall_count', 'COUNT', 'count']),
    counter_value: signalFrom(signals, COUNTER_SIGNAL_KEYS),
    slot_count: signalFrom(signals, SLOT_SIGNAL_KEYS),
    active_slot_count: signalFrom(signals, ACTIVE_SLOT_SIGNAL_KEYS),
    cycle_time: signalFrom(signals, CYCLE_SIGNAL_KEYS),
    machine_speed: signalFrom(signals, SPEED_SIGNAL_KEYS),
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
  const overallAlias = firstPresent(signals, ['OVERALL_COUNT', 'overall_count', 'COUNT', 'count']);
  const cycleAlias = firstPresent(signals, CYCLE_SIGNAL_KEYS);
  return LIVE_PAYLOAD_KEYS.filter((key) => {
    if (key === 'OVERALL_COUNT') {
      return overallAlias ? signals[overallAlias] !== undefined && signals[overallAlias] !== null : false;
    }
    if (key === 'CYCLE_TIME') {
      return cycleAlias ? signals[cycleAlias] !== undefined && signals[cycleAlias] !== null : false;
    }
    return signals[key] !== undefined && signals[key] !== null;
  }).map((key) => ({
    key,
    value:
      key === 'OVERALL_COUNT'
        ? signals[overallAlias]
        : key === 'CYCLE_TIME'
          ? signals[cycleAlias]
          : signals[key],
  }));
}

function signalNumber(payload, keys) {
  const signals = payload?.signals && typeof payload.signals === 'object' ? payload.signals : payload || {};
  const key = firstPresent(signals, keys);
  return key ? numberOrNull(signals[key]) : null;
}

function columnOrSignal(iotLive, column, keys) {
  if (!iotLive) return null;
  const fromColumn = numberOrNull(iotLive[column]);
  if (fromColumn !== null) return fromColumn;
  return signalNumber(iotLive.payload, keys);
}

export function getIotJobCount(iotLive) {
  return columnOrSignal(iotLive, 'counter_value', COUNTER_SIGNAL_KEYS);
}

export function getIotSlotCount(iotLive) {
  return columnOrSignal(iotLive, 'slot_count', SLOT_SIGNAL_KEYS);
}

export function getIotActiveSlotCount(iotLive) {
  return columnOrSignal(iotLive, 'active_slot_count', ACTIVE_SLOT_SIGNAL_KEYS);
}

export function getIotMachineSpeed(iotLive) {
  return columnOrSignal(iotLive, 'machine_speed', SPEED_SIGNAL_KEYS);
}

export function getIotCycleTime(iotLive) {
  return columnOrSignal(iotLive, 'cycle_time', CYCLE_SIGNAL_KEYS);
}

export function getIotParamValue(iotLive, param) {
  if (!param) return null;
  if (param.column) return columnOrSignal(iotLive, param.column, param.aliases || [param.key]);
  return signalNumber(iotLive?.payload, param.aliases || [param.key]);
}
