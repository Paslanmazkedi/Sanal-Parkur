export const IOT_PARAM_CATALOG = [
  {
    key: 'COUNTER_VALUE',
    label: 'Üretilen',
    unit: 'adet',
    surface: 'order',
    column: 'counter_value',
    aliases: ['COUNTER_VALUE', 'counter_value'],
  },
  {
    key: 'SLOT_COUNT',
    label: 'Slot',
    unit: '',
    surface: 'card',
    card: 1,
    column: 'slot_count',
    aliases: ['SLOT_COUNT', 'slot_count'],
  },
  {
    key: 'ACTIVE_SLOT_COUNT',
    label: 'Aktif slot',
    unit: '',
    surface: 'card',
    card: 2,
    column: 'active_slot_count',
    aliases: ['ACTIVE_SLOT_COUNT', 'active_slot_count'],
  },
  {
    key: 'MACHINE_SPEED',
    label: 'Hız',
    unit: '',
    surface: 'card',
    card: 3,
    widget: 'gauge',
    min: 0,
    max: 100,
    column: 'machine_speed',
    aliases: ['MACHINE_SPEED', 'machine_speed'],
  },
  {
    key: 'CYCLE_TIME',
    label: 'Çevrim',
    unit: 'sn',
    surface: 'detail',
    column: 'cycle_time',
    aliases: ['CYCLE_TIME', 'cycle_time', 'CYCLE_SEC', 'cycle_sec', 'CEVRIM_SURESI'],
  },
  {
    key: 'OVERALL_COUNT',
    label: 'Ömürlük sayaç',
    unit: 'adet',
    surface: 'detail',
    column: 'overall_count',
    aliases: ['OVERALL_COUNT', 'overall_count', 'COUNT', 'count'],
  },
  {
    key: 'MACHINE_STATUS',
    label: 'Makine durumu',
    unit: '',
    surface: 'status',
    column: 'machine_status',
    aliases: ['MACHINE_STATUS', 'machine_status'],
  },
  { key: 'POWER_1', label: 'Güç 1', unit: '', surface: 'detail', aliases: ['POWER_1'] },
  { key: 'POWER_2', label: 'Güç 2', unit: '', surface: 'detail', aliases: ['POWER_2'] },
  { key: 'POWER_3', label: 'Güç 3', unit: '', surface: 'detail', aliases: ['POWER_3'] },
  { key: 'POWER_4', label: 'Güç 4', unit: '', surface: 'detail', aliases: ['POWER_4'] },
  { key: 'POWER_5', label: 'Güç 5', unit: '', surface: 'detail', aliases: ['POWER_5'] },
  { key: 'POWER_6', label: 'Güç 6', unit: '', surface: 'detail', aliases: ['POWER_6'] },
  { key: 'SPOT_TIME', label: 'Spot süre', unit: '', surface: 'detail', aliases: ['SPOT_TIME'] },
  { key: 'COOL_TIME', label: 'Soğuma', unit: '', surface: 'detail', aliases: ['COOL_TIME'] },
  { key: 'TRAFO_TIME', label: 'Trafo süre', unit: '', surface: 'detail', aliases: ['TRAFO_TIME'] },
];

export function getScoreCardParams() {
  return IOT_PARAM_CATALOG.filter((param) => param.surface === 'card').sort((a, b) => a.card - b.card);
}

export function getParamByKey(key) {
  const needle = String(key || '').toUpperCase();
  return (
    IOT_PARAM_CATALOG.find((param) => param.key === needle) ||
    IOT_PARAM_CATALOG.find((param) => (param.aliases || []).some((alias) => String(alias).toUpperCase() === needle)) ||
    null
  );
}

export function formatParamValue(value, param) {
  if (value == null || value === '') return '—';
  const numeric = Number(value);
  const text = Number.isFinite(numeric) ? numeric.toLocaleString('tr-TR') : String(value);
  if (param?.unit) return `${text} ${param.unit}`;
  return text;
}
