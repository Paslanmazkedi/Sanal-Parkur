import { summarizeStations } from '@/lib/oee';

export async function loadDashboardSnapshot(supabase) {
  const [
    ordersRes,
    workstationsRes,
    logsRes,
    machinesRes,
    operationsRes,
    finishLinesRes,
    timeEntriesRes,
  ] = await Promise.all([
    supabase
      .from('production_orders')
      .select('p_order_id,p_order_no,product_name2,station_id,is_stage,counter_value,quantity'),
    supabase
      .from('workstations')
      .select('station_id,station_name,active')
      .order('station_id', { ascending: true }),
    supabase
      .from('logs')
      .select('id,direction,payload,created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('machines')
      .select('id,machine_name,machine_code,status,station_id'),
    supabase
      .from('production_order_operations')
      .select('id,p_order_id,asset_id,type,start_counter,created_at')
      .order('id', { ascending: false })
      .limit(5),
    supabase
      .from('order_finish_lines')
      .select('id,basket_type,quantity,created_at')
      .eq('basket_type', 'scrap')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('order_time_entries')
      .select('id,entry_date,created_at,order_time_entry_lines(minutes_spent)')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const orders = ordersRes.data || [];
  const workstations = workstationsRes.data || [];
  const logs = logsRes.error ? [] : logsRes.data || [];
  const machines = machinesRes.error ? [] : machinesRes.data || [];
  const operations = operationsRes.error ? [] : operationsRes.data || [];
  const scrapLines = finishLinesRes.error ? [] : finishLinesRes.data || [];
  const timeEntries = timeEntriesRes.error ? [] : timeEntriesRes.data || [];

  const activeOrders = orders.filter((o) => [0, 1].includes(Number(o.is_stage)));
  const queueOrders = orders.filter((o) => Number(o.is_stage) === 4);
  const faultOrders = orders.filter((o) => Number(o.is_stage) === 3);
  const completedOrders = orders.filter((o) => Number(o.is_stage) === 2);

  const stationSummaries = summarizeStations(
    workstations.filter((ws) => ws.active !== 0),
    orders.filter((o) => [0, 1, 3, 4].includes(Number(o.is_stage))),
  );

  const avgOee = stationSummaries.length
    ? Math.round(
        (stationSummaries.reduce((sum, item) => sum + item.metrics.oee, 0) / stationSummaries.length) * 10,
      ) / 10
    : 0;

  const runningStations = stationSummaries.filter((s) => Number(s.statusStage) === 1).length;
  const scrapTotal = scrapLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);

  const totalLaborMinutes = timeEntries.reduce((sum, entry) => {
    const lines = entry.order_time_entry_lines || [];
    return sum + lines.reduce((lineSum, line) => lineSum + (Number(line.minutes_spent) || 0), 0);
  }, 0);

  const activeMachines = machines.filter((m) => m.status === 'active').length;
  const offlineMachines = machines.filter((m) => m.status === 'offline').length;
  const maintenanceMachines = machines.filter((m) => m.status === 'maintenance').length;

  const logSuccessCount = logs.filter((log) => log.payload?.outcome === 'SUCCESS').length;
  const logFailedCount = logs.filter((log) => log.payload?.outcome === 'FAILED').length;

  const recentOrders = [...orders]
    .sort((a, b) => Number(b.p_order_id) - Number(a.p_order_id))
    .slice(0, 6);

  return {
    production: {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      queueOrders: queueOrders.length,
      faultOrders: faultOrders.length,
      completedOrders: completedOrders.length,
      avgOee,
      runningStations,
      stationCount: workstations.filter((ws) => ws.active !== 0).length,
      laborMinutesToday: totalLaborMinutes,
    },
    quality: {
      scrapLines: scrapLines.length,
      scrapTotal,
      moduleReady: false,
    },
    service: {
      machineCount: machines.length,
      activeMachines,
      offlineMachines,
      maintenanceMachines,
      moduleReady: machines.length > 0,
    },
    integration: {
      recentLogCount: logs.length,
      logSuccessCount,
      logFailedCount,
      signalCount: operations.length,
    },
    stationSummaries: stationSummaries.slice(0, 6),
    recentLogs: logs.slice(0, 6),
    recentOperations: operations,
    recentOrders,
    errors: [
      ordersRes.error?.message,
      workstationsRes.error?.message,
      logsRes.error?.message,
    ].filter(Boolean),
  };
}
