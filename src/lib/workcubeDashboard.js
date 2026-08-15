import { STAGE_CHART_ORDER, STAGE_META } from './stationStages';

export async function fetchWorkcubeDashboard(companyId = 1) {
  const query = `company_id=${companyId}`;

  const [ordersRes, stationsRes] = await Promise.all([
    fetch(`/api/w3/production-orders?${query}`, { cache: 'no-store' }),
    fetch(`/api/w3/workstations?${query}`, { cache: 'no-store' }),
  ]);

  const ordersPayload = await ordersRes.json();
  const stationsPayload = await stationsRes.json();

  if (!ordersRes.ok || !ordersPayload.success) {
    throw new Error(ordersPayload.error || 'Workcube üretim emirleri alınamadı.');
  }

  if (!stationsRes.ok || !stationsPayload.success) {
    throw new Error(stationsPayload.error || 'Workcube istasyon verisi alınamadı.');
  }

  const orders = ordersPayload.rows || [];
  const stations = stationsPayload.rows || [];

  return {
    companyId,
    fetchedAt: ordersPayload.fetchedAt || new Date().toISOString(),
    production: summarizeWorkcubeProduction(orders, stations),
    orders,
    stations,
  };
}

function countByStage(orders, stage) {
  return orders.filter((order) => Number(order.PRODUCTION_STAGE) === stage).length;
}

function computeHealthScore(isActive, stationOrders) {
  if (!isActive) return 35;
  const paused = stationOrders.filter((order) => Number(order.PRODUCTION_STAGE) === 3).length;
  const running = stationOrders.filter((order) => Number(order.PRODUCTION_STAGE) === 1).length;
  if (paused > 0) return Math.max(35, 88 - paused * 18);
  if (running > 0) return 92;
  return 78;
}

export function buildStationStatuses(orders, stations) {
  return stations
    .map((station) => {
      const stationId = Number(station.STATION_ID);
      const stationOrders = orders.filter(
        (order) =>
          Number(order.STATION_ID) === stationId ||
          (order.STATION_NAME && order.STATION_NAME === station.STATION_NAME),
      );
      const completed = stationOrders.filter((order) => Number(order.PRODUCTION_STAGE) === 2).length;
      const active = stationOrders.filter((order) =>
        [0, 1, 3, 4].includes(Number(order.PRODUCTION_STAGE)),
      ).length;
      const total = stationOrders.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: stationId,
        name: station.STATION_NAME || `İstasyon #${stationId}`,
        branch: station.BRANCH_NAME || '',
        isActive: Number(station.ACTIVE) === 1,
        totalOrders: total,
        activeOrders: active,
        completedOrders: completed,
        progress,
        healthScore: computeHealthScore(Number(station.ACTIVE) === 1, stationOrders),
      };
    })
    .sort((a, b) => b.activeOrders - a.activeOrders || a.id - b.id);
}

export function buildActiveOrders(orders, limit = 8) {
  return orders
    .filter((order) => [0, 1, 3, 4].includes(Number(order.PRODUCTION_STAGE)))
    .slice(0, limit)
    .map((order) => ({
      id: order.P_ORDER_ID,
      orderNo: order.P_ORDER_NO || '—',
      product: order.PRODUCT_NAME || '—',
      station: order.STATION_NAME || '—',
      lot: order.LOT_NO || '—',
      quantity: order.QUANTITY ?? '—',
      stage: Number(order.PRODUCTION_STAGE),
      stageLabel: order.PRODUCTION_STAGE_STATUS || '—',
    }));
}

export function summarizeWorkcubeProduction(orders, stations) {
  const running = countByStage(orders, 1);
  const paused = countByStage(orders, 3);
  const queue = countByStage(orders, 4);
  const control = countByStage(orders, 0);
  const completed = countByStage(orders, 2);
  const activeStations = stations.filter((row) => Number(row.ACTIVE) === 1).length;
  const stationStatuses = buildStationStatuses(orders, stations);
  const activeOrders = buildActiveOrders(orders);

  const producedQuantity = orders
    .filter((order) => Number(order.PRODUCTION_STAGE) === 2)
    .reduce((sum, order) => sum + (Number(order.QUANTITY) || 0), 0);

  const stageBreakdown = STAGE_CHART_ORDER.map((stage) => ({
    stage,
    label: STAGE_META[stage].label,
    tone: STAGE_META[stage].tone,
    barClass: STAGE_META[stage].barClass,
    count: countByStage(orders, stage),
  }));

  return {
    totalOrders: orders.length,
    running,
    paused,
    queue,
    control,
    completed,
    activeAlarms: paused,
    activeStations,
    totalStations: stations.length,
    producedQuantity,
    stageBreakdown,
    stationStatuses,
    activeOrders,
    highlightOrders: activeOrders.slice(0, 6),
    dailyPerformance: {
      completed,
      running,
      queue,
      paused,
    },
  };
}
