'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StationCommandPanel from '@/components/operator/StationCommandPanel';
import StationSelectorBar from '@/components/operator/StationSelectorBar';
import TimeEntryModal from '@/components/operator/TimeEntryModal';
import FinishOrderModal from '@/components/operator/FinishOrderModal';
import { calculateOee, pickActiveOrder } from '@/lib/oee';
import { getStageMeta } from '@/lib/stationStages';
import { STATION_STORAGE_KEY } from '@/lib/operatorConstants';
import { postOperatorAction } from '@/lib/operatorApi';
import { supabase } from '../supabase';

const POLL_MS = 8000;

function formatClock(date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function OrderPickRow({ order, selected, onSelect }) {
  const stage = getStageMeta(order.is_stage);
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-sm font-semibold text-white">{order.p_order_no}</p>
        <p className="truncate text-xs text-slate-400">{order.product_name2}</p>
      </div>
      <div className="ml-3 shrink-0 text-right">
        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${stage.className}`}>
          {stage.label}
        </span>
        <p className="mt-1 font-mono text-[10px] text-slate-500">
          {order.counter_value ?? 0}/{order.quantity ?? 0}
        </p>
      </div>
    </button>
  );
}

function StationOperatorContent() {
  const searchParams = useSearchParams();
  const [workstations, setWorkstations] = useState([]);
  const [operators, setOperators] = useState([]);
  const [stationId, setStationId] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [recentTimeEntries, setRecentTimeEntries] = useState([]);

  useEffect(() => {
    const urlStation = searchParams.get('station') || searchParams.get('station_id') || '';
    const storedStation = typeof window !== 'undefined' ? window.localStorage.getItem(STATION_STORAGE_KEY) : '';
    setStationId(urlStation || storedStation || '');
  }, [searchParams]);

  useEffect(() => {
    const loadMeta = async () => {
      const [stationsRes, operatorsRes] = await Promise.all([
        supabase
          .from('workstations')
          .select('station_id,station_name,branch,department,active')
          .order('station_id', { ascending: true }),
        supabase
          .from('operators')
          .select('id,operator_code,full_name')
          .eq('is_active', true)
          .order('full_name', { ascending: true }),
      ]);

      if (stationsRes.error) setError(stationsRes.error.message);
      else setWorkstations(stationsRes.data || []);

      if (!operatorsRes.error) setOperators(operatorsRes.data || []);
    };

    loadMeta();
  }, []);

  const loadStationOrders = useCallback(async () => {
    if (!stationId) {
      setLoading(false);
      setOrders([]);
      setRecentTimeEntries([]);
      return;
    }

    window.localStorage.setItem(STATION_STORAGE_KEY, stationId);

    const numericStationId = Number(stationId);
    const { data, error: ordersError } = await supabase
      .from('production_orders')
      .select('p_order_id,p_order_no,product_name2,lot_no,quantity,counter_value,station_id,is_stage')
      .eq('station_id', numericStationId)
      .in('is_stage', [0, 1, 3, 4])
      .order('p_order_id', { ascending: true });

    if (ordersError) {
      setError(ordersError.message);
    } else {
      setOrders(data || []);
      setError('');
    }

    const { data: timeData, error: timeError } = await supabase
      .from('order_time_entries')
      .select('id,entry_date,notes,created_at,p_order_id,order_time_entry_lines(operator_name,minutes_spent)')
      .eq('station_id', numericStationId)
      .order('created_at', { ascending: false })
      .limit(8);

    if (!timeError && timeData) setRecentTimeEntries(timeData);

    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    setLoading(true);
    loadStationOrders();
    const poll = setInterval(loadStationOrders, POLL_MS);
    return () => clearInterval(poll);
  }, [loadStationOrders]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const workstation = workstations.find((ws) => String(ws.station_id) === String(stationId));
  const activeOrders = useMemo(() => orders.filter((o) => [0, 1, 3].includes(Number(o.is_stage))), [orders]);
  const queueOrders = useMemo(() => orders.filter((o) => Number(o.is_stage) === 4), [orders]);
  const runningCount = useMemo(() => orders.filter((o) => Number(o.is_stage) === 1).length, [orders]);

  const selectedOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find((o) => o.p_order_id === selectedOrderId) || null;
    }
    return pickActiveOrder(orders);
  }, [orders, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId && selectedOrder) {
      setSelectedOrderId(selectedOrder.p_order_id);
    }
  }, [selectedOrder, selectedOrderId]);

  const activeWorkers = useMemo(() => {
    const names = new Set();
    const today = new Date().toISOString().slice(0, 10);

    const relevantEntries = selectedOrder
      ? recentTimeEntries.filter((e) => e.p_order_id === selectedOrder.p_order_id)
      : recentTimeEntries.filter((e) => e.entry_date === today);

    relevantEntries.forEach((entry) => {
      (entry.order_time_entry_lines || []).forEach((line) => {
        if (line.operator_name) names.add(line.operator_name);
      });
    });

    return [...names];
  }, [recentTimeEntries, selectedOrder]);

  const metrics = calculateOee({ activeOrder: selectedOrder });

  const handleStationChange = (nextStationId) => {
    setStationId(nextStationId);
    setSelectedOrderId(null);
    setLoading(true);
  };

  const handleAction = async (action) => {
    if (!selectedOrder || !stationId) return;

    if (action === 'finish') {
      setFinishModalOpen(true);
      return;
    }

    setBusy(true);
    setSuccessMsg('');
    setError('');

    try {
      await postOperatorAction({
        action,
        pOrderId: selectedOrder.p_order_id,
        stationId: Number(stationId),
      });
      setSuccessMsg(`${action} işlemi kaydedildi.`);
      await loadStationOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMutationSuccess = async (message) => {
    setSuccessMsg(message);
    setSelectedOrderId(null);
    await loadStationOrders();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">Operatör Paneli</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Saha İşlemleri</h1>
        <p className="mt-1 text-sm text-slate-400">
          İstasyon seçin, emri belirleyin ve kontrol / başlat / bitir işlemlerini uygulayın.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          {successMsg}
        </div>
      )}

      <StationSelectorBar
        workstations={workstations}
        stationId={stationId}
        onStationChange={handleStationChange}
      />

      {stationId && (
        <StationCommandPanel
          stationId={stationId}
          workstation={workstation}
          activeWorkers={activeWorkers}
          activeOrderCount={runningCount}
          metrics={metrics}
          selectedOrder={selectedOrder}
          loading={loading}
          busy={busy}
          clock={formatClock(now)}
          onAction={handleAction}
          onOpenTimeEntry={() => setTimeModalOpen(true)}
        />
      )}

      {stationId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              Aktif / Duraklatılmış ({activeOrders.length})
            </h3>
            <div className="space-y-2">
              {activeOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Kayıt yok.</p>
              ) : (
                activeOrders.map((order) => (
                  <OrderPickRow
                    key={order.p_order_id}
                    order={order}
                    selected={selectedOrder?.p_order_id === order.p_order_id}
                    onSelect={(o) => setSelectedOrderId(o.p_order_id)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              Kuyruk ({queueOrders.length})
            </h3>
            <div className="space-y-2">
              {queueOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Bekleyen emir yok.</p>
              ) : (
                queueOrders.map((order) => (
                  <OrderPickRow
                    key={order.p_order_id}
                    order={order}
                    selected={selectedOrder?.p_order_id === order.p_order_id}
                    onSelect={(o) => setSelectedOrderId(o.p_order_id)}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {stationId && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
            Son Zaman Girişleri
          </h3>
          {recentTimeEntries.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz zaman kaydı yok.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentTimeEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-slate-400">{entry.entry_date}</p>
                    {entry.p_order_id && (
                      <span className="text-[10px] text-slate-500">Emir #{entry.p_order_id}</span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1 text-slate-300">
                    {(entry.order_time_entry_lines || []).map((line, idx) => (
                      <li key={idx} className="text-xs">
                        {line.operator_name}: <span className="text-emerald-400">{line.minutes_spent} dk</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <TimeEntryModal
        open={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
        order={selectedOrder}
        stationId={Number(stationId)}
        operators={operators}
        onSuccess={() => handleMutationSuccess('Zaman harcaması kaydedildi.')}
      />

      <FinishOrderModal
        open={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        order={selectedOrder}
        stationId={Number(stationId)}
        onSuccess={() => handleMutationSuccess('Emir bitirildi ve basketler kaydedildi.')}
      />
    </div>
  );
}

export default function StationOperatorPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Operatör paneli yükleniyor...</div>}>
      <StationOperatorContent />
    </Suspense>
  );
}
