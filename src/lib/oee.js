/**
 * Basit OEE hesabı — mevcut production_orders verisiyle MVP.
 * Gerçek OEE için docs/station-oee-schema.sql tabloları doldurulmalı.
 *
 * OEE = Availability × Performance × Quality / 10000
 */

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 10) / 10;
}

export function calculateAvailability(activeOrder) {
  if (!activeOrder) return 70;

  switch (Number(activeOrder.is_stage)) {
    case 1:
      return 95;
    case 0:
      return 82;
    case 3:
      return 15;
    default:
      return 60;
  }
}

export function calculatePerformance(activeOrder) {
  if (!activeOrder) return 0;

  const target = Number(activeOrder.quantity) || 0;
  const actual = Number(activeOrder.counter_value) || 0;

  if (target <= 0) {
    return Number(activeOrder.is_stage) === 1 ? 88 : 0;
  }

  return clamp((actual / target) * 100);
}

export function calculateQuality(_activeOrder, qualityOverride) {
  if (typeof qualityOverride === 'number') return clamp(qualityOverride);
  return 100;
}

export function calculateOee({ activeOrder, qualityOverride } = {}) {
  const availability = calculateAvailability(activeOrder);
  const performance = calculatePerformance(activeOrder);
  const quality = calculateQuality(activeOrder, qualityOverride);
  const oee = (availability * performance * quality) / 10000;

  return {
    oee: round(oee),
    availability: round(availability),
    performance: round(performance),
    quality: round(quality),
  };
}

export function getOeeTone(oee) {
  if (oee >= 85) return 'emerald';
  if (oee >= 60) return 'amber';
  return 'rose';
}

export function getOeeBorderClass(oee) {
  const tone = getOeeTone(oee);
  if (tone === 'emerald') return 'border-emerald-500/40 shadow-emerald-900/20';
  if (tone === 'amber') return 'border-amber-500/40 shadow-amber-900/20';
  return 'border-rose-500/40 shadow-rose-900/20';
}

export function getOeeTextClass(oee) {
  const tone = getOeeTone(oee);
  if (tone === 'emerald') return 'text-emerald-400';
  if (tone === 'amber') return 'text-amber-400';
  return 'text-rose-400';
}

export function pickActiveOrder(orders = []) {
  const running = orders.find((o) => Number(o.is_stage) === 1);
  if (running) return running;

  const atOperator = orders.find((o) => Number(o.is_stage) === 0);
  if (atOperator) return atOperator;

  const fault = orders.find((o) => Number(o.is_stage) === 3);
  if (fault) return fault;

  return null;
}

export function summarizeStations(workstations = [], orders = []) {
  return workstations.map((station) => {
    const stationOrders = orders.filter(
      (order) => Number(order.station_id) === Number(station.station_id),
    );
    const activeOrder = pickActiveOrder(stationOrders);
    const queueCount = stationOrders.filter((o) => Number(o.is_stage) === 4).length;
    const orderCount = stationOrders.length;
    const metrics = calculateOee({ activeOrder });

    const pausedCount = stationOrders.filter((o) => Number(o.is_stage) === 3).length;
    const runningCount = stationOrders.filter((o) => Number(o.is_stage) === 1).length;

    return {
      station,
      activeOrder,
      queueCount,
      pausedCount,
      runningCount,
      orderCount,
      metrics,
      statusStage: activeOrder?.is_stage ?? (queueCount > 0 ? 4 : null),
    };
  });
}
