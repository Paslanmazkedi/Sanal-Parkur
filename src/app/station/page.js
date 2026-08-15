'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import StationOrderBoard from '@/components/operator/StationOrderBoard';
import StationRunConsole from '@/components/operator/StationRunConsole';
import TimeEntryModal from '@/components/operator/TimeEntryModal';
import FinishOrderModal from '@/components/operator/FinishOrderModal';
import { pickActiveOrder } from '@/lib/oee';
import { postOperatorAction } from '@/lib/operatorApi';
import { useOperatorKiosk } from '@/hooks/useOperatorKiosk';
import { supabase } from '../supabase';

const POLL_MS = 8000;
const ORDER_SELECT =
  'p_order_id,p_order_no,product_name2,lot_no,quantity,counter_value,station_id,is_stage,start_date';

function formatClock(date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function fetchOpenOrders(extra = {}) {
  let query = supabase
    .from('production_orders')
    .select(ORDER_SELECT)
    .in('is_stage', [0, 1, 3, 4])
    .order('p_order_id', { ascending: true });

  if (extra.stationId) {
    query = query.eq('station_id', Number(extra.stationId));
  }

  const first = await query;
  if (!first.error) return first;

  if (String(first.error.message || '').includes('start_date')) {
    let fallback = supabase
      .from('production_orders')
      .select('p_order_id,p_order_no,product_name2,lot_no,quantity,counter_value,station_id,is_stage')
      .in('is_stage', [0, 1, 3, 4])
      .order('p_order_id', { ascending: true });
    if (extra.stationId) fallback = fallback.eq('station_id', Number(extra.stationId));
    return fallback;
  }

  return first;
}

function StationOperatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kiosk = useOperatorKiosk();
  const [workstations, setWorkstations] = useState([]);
  const [operators, setOperators] = useState([]);
  const [stationId, setStationId] = useState('');
  const [runOrderId, setRunOrderId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [listOrders, setListOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);

  useEffect(() => {
    const urlStation = searchParams.get('station') || searchParams.get('station_id') || '';
    const urlOrder = searchParams.get('order') || '';
    setStationId(urlStation);
    setRunOrderId(urlOrder || null);
    if (urlOrder) setSelectedOrderId(Number(urlOrder) || urlOrder);
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
          .select('id,operator_code,full_name,default_station_id')
          .eq('is_active', true)
          .order('full_name', { ascending: true }),
      ]);

      if (stationsRes.error) setError(stationsRes.error.message);
      else setWorkstations(stationsRes.data || []);

      if (!operatorsRes.error) setOperators(operatorsRes.data || []);
    };

    loadMeta();
  }, []);

  const loadListOrders = useCallback(async ({ initial = false } = {}) => {
    if (initial) setListLoading(true);
    const { data, error: ordersError } = await fetchOpenOrders();

    if (ordersError) {
      setError(ordersError.message);
    } else {
      setListOrders(data || []);
      setError('');
    }
    if (initial) setListLoading(false);
  }, []);

  const loadStationOrders = useCallback(async () => {
    if (!stationId) {
      setLoading(false);
      setOrders([]);
      return;
    }

    const { data, error: ordersError } = await fetchOpenOrders({ stationId });

    if (ordersError) {
      setError(ordersError.message);
    } else {
      setOrders(data || []);
      setError('');
    }

    setLoading(false);
  }, [stationId]);

  const showConsole = Boolean(stationId && runOrderId);

  useEffect(() => {
    if (showConsole) return undefined;

    loadListOrders({ initial: true });
    const poll = setInterval(() => loadListOrders(), POLL_MS);
    return () => clearInterval(poll);
  }, [showConsole, loadListOrders]);

  useEffect(() => {
    if (!showConsole) return undefined;

    setLoading(true);
    loadStationOrders();
    const poll = setInterval(loadStationOrders, POLL_MS);
    return () => clearInterval(poll);
  }, [showConsole, loadStationOrders]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeWorkstations = useMemo(
    () => workstations.filter((ws) => ws.active !== 0),
    [workstations],
  );

  const filteredListOrders = useMemo(() => {
    if (!stationId) return listOrders;
    return listOrders.filter((order) => String(order.station_id) === String(stationId));
  }, [listOrders, stationId]);

  const workstation = workstations.find((ws) => String(ws.station_id) === String(stationId));
  const activeOrders = useMemo(() => orders.filter((o) => [0, 1, 3].includes(Number(o.is_stage))), [orders]);
  const queueOrders = useMemo(() => orders.filter((o) => Number(o.is_stage) === 4), [orders]);
  const blockingOrder = useMemo(
    () => orders.find((o) => Number(o.is_stage) === 1) || null,
    [orders],
  );

  const selectedOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find((o) => String(o.p_order_id) === String(selectedOrderId)) || null;
    }
    return pickActiveOrder(orders);
  }, [orders, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId && selectedOrder) {
      setSelectedOrderId(selectedOrder.p_order_id);
    }
  }, [selectedOrder, selectedOrderId]);

  const replaceStationUrl = (nextStationId, nextOrderId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('station_id');
    if (nextStationId) params.set('station', String(nextStationId));
    else params.delete('station');
    if (nextOrderId) params.set('order', String(nextOrderId));
    else params.delete('order');
    const query = params.toString();
    router.replace(query ? `/station?${query}` : '/station');
  };

  const handleFilterStation = (nextStationId) => {
    setStationId(nextStationId);
    setRunOrderId(null);
    setSelectedOrderId(null);
    setSuccessMsg('');
    setError('');
    replaceStationUrl(nextStationId, null);
  };

  const handleEnterOrder = (order) => {
    const nextStationId = String(order.station_id);
    setStationId(nextStationId);
    setRunOrderId(String(order.p_order_id));
    setSelectedOrderId(order.p_order_id);
    setSuccessMsg('');
    setError('');
    setLoading(true);
    replaceStationUrl(nextStationId, order.p_order_id);
  };

  const handleBackToList = () => {
    setRunOrderId(null);
    setSelectedOrderId(null);
    setOrders([]);
    setSuccessMsg('');
    setError('');
    replaceStationUrl(stationId, null);
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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      {kiosk && (
        <header className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <BrandLogo size="sm" showTagline={false} asLink={false} />
          <Link
            href="/station?kiosk=0"
            className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-semibold text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
          >
            Tam panel
          </Link>
        </header>
      )}

      <div className="mb-2 flex shrink-0 items-end gap-3">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            İstasyon
          </span>
          <select
            value={stationId}
            onChange={(event) => handleFilterStation(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-emerald-500"
          >
            <option value="">Tüm istasyonlar</option>
            {activeWorkstations.map((ws) => (
              <option key={ws.station_id} value={String(ws.station_id)}>
                #{ws.station_id} · {ws.station_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-2 shrink-0 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-2 shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
          {successMsg}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {showConsole ? (
          <StationRunConsole
            stationId={stationId}
            workstation={workstation}
            selectedOrder={selectedOrder}
            loading={loading}
            busy={busy}
            clock={formatClock(now)}
            onBack={handleBackToList}
            onAction={handleAction}
            onOpenTimeEntry={() => setTimeModalOpen(true)}
            blockingOrder={
              blockingOrder && selectedOrder && blockingOrder.p_order_id !== selectedOrder.p_order_id
                ? blockingOrder
                : null
            }
            activeOrders={activeOrders}
            queueOrders={queueOrders}
            onSelectOrder={setSelectedOrderId}
          />
        ) : (
          <StationOrderBoard
            orders={filteredListOrders}
            workstations={workstations}
            loading={listLoading}
            onEnter={handleEnterOrder}
          />
        )}
      </div>

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
        onSuccess={() => handleMutationSuccess('Sonuç kaydedildi.')}
      />
    </div>
  );
}

export default function StationOperatorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 items-center justify-center text-slate-500">Operatör paneli yükleniyor...</div>
      }
    >
      <StationOperatorContent />
    </Suspense>
  );
}
