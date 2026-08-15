export const OPERATOR_ACTIONS = {
  control: { label: 'Kontrol', toStage: 0, fromStages: [4] },
  start: { label: 'Başlat', toStage: 1, fromStages: [0, 3, 4] },
  pause: { label: 'Duraklat', toStage: 3, fromStages: [1] },
  finish: { label: 'Sonuç gir', toStage: 2, fromStages: [0, 1, 3] },
};

export function canPerformAction(action, currentStage) {
  const config = OPERATOR_ACTIONS[action];
  if (!config) return false;
  return config.fromStages.includes(Number(currentStage));
}

export function getActionDisabledReason(action, currentStage, hasSelectedOrder, extra = {}) {
  if (!hasSelectedOrder) return 'Önce bir üretim emri seçin.';
  const config = OPERATOR_ACTIONS[action];
  if (!config) return 'Geçersiz aksiyon.';
  if (!config.fromStages.includes(Number(currentStage))) {
    return `${config.label} için uygun durum değil (mevcut: ${currentStage}).`;
  }
  if (action === 'start' && extra.blockingOrder) {
    const orderNo = extra.blockingOrder.p_order_no || `#${extra.blockingOrder.p_order_id}`;
    return `Önce ${orderNo} emrini duraklatın veya sonuç girin.`;
  }
  return null;
}

export const BASKET_TYPES = {
  produced: { label: 'Uretilen Urun', tone: 'emerald' },
  consumed: { label: 'Tuketilen Sarf', tone: 'sky' },
  scrap: { label: 'Fire', tone: 'rose' },
};

export const EMPTY_BASKET_LINE = {
  stock_code: '',
  product_name: '',
  spec: '',
  lot_no: '',
  serial_no: '',
  quantity: '',
  unit: 'Adet',
};

export const EMPTY_TIME_LINE = {
  operator_id: '',
  operator_name: '',
  minutes_spent: '',
};

export const STATION_STORAGE_KEY = 'operator_selected_station_id';
