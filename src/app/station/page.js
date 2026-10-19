'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import LiveClock from '@/components/LiveClock';
import StationOrderBoard from '@/components/operator/StationOrderBoard';
import StationRunConsole from '@/components/operator/StationRunConsole';
import TimeEntryModal from '@/components/operator/TimeEntryModal';
import FinishOrderModal from '@/components/operator/FinishOrderModal';
import PauseReasonModal from '@/components/operator/PauseReasonModal';
import { pickActiveOrder } from '@/lib/oee';
import { postOperatorAction } from '@/lib/operatorApi';
import { getMachineStatusLabel } from '@/lib/iotStation';
import { useOperatorKiosk } from '@/hooks/useOperatorKiosk';
import { supabase } from '../supabase';

const IOT_SELECT =
  'station_id,overall_count,counter_value,slot_count,active_slot_count,cycle_time,machine_speed,machine_status,plc_p_order_id,queue_p_order_id,queue_quantity,read_at,payload,updated_at';

const POLL_MS = 8000;
const ORDER_SELECT =
  'p_order_id,p_order_no,product_name2,lot_no,quantity,counter_value,station_id,is_stage,start_date';

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
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [iotLive, setIotLive] = useState(null);

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

  const loadIotLive = useCallback(async () => {
    if (!stationId) {
      setIotLive(null);
      return;
    }

    const { data, error: iotError } = await supabase
      .from('sp_station')
      .select(IOT_SELECT)
      .eq('station_id', Number(stationId))
      .maybeSingle();

    if (iotError) {
      if (!String(iotError.message || '').includes('sp_station')) {
        setError(iotError.message);
      }
      setIotLive(null);
      return;
    }

    setIotLive(data || null);
  }, [stationId]);

  const showConsole = Boolean(stationId && runOrderId);

  useEffect(() => {
    if (showConsole) return undefined;

    loadListOrders({ initial: true });
    const poll = setInterval(() => loadListOrders(), POLL_MS);
    return () => clearInterval(poll);
  }, [showConsole, loadListOrders]);

  useEffect(() => {
    if (!stationId) {
      setIotLive(null);
      return undefined;
    }

    loadIotLive();
    const poll = setInterval(loadIotLive, POLL_MS);
    return () => clearInterval(poll);
  }, [stationId, loadIotLive]);

  useEffect(() => {
    if (!showConsole) return undefined;

    setLoading(true);
    loadStationOrders();
    const poll = setInterval(loadStationOrders, POLL_MS);
    return () => clearInterval(poll);
  }, [showConsole, loadStationOrders]);

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
    setStationId('');
    setOrders([]);
    setSuccessMsg('');
    setError('');
    replaceStationUrl(null, null);
  };

  const handleAction = async (action) => {
    if (!selectedOrder || !stationId) return;

    if (action === 'finish') {
      setFinishModalOpen(true);
      return;
    }

    if (action === 'pause') {
      setPauseModalOpen(true);
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

  const handlePauseConfirm = async ({ typeId, detail }) => {
    if (!selectedOrder || !stationId) return;
    setBusy(true);
    setSuccessMsg('');
    setError('');
    try {
      await postOperatorAction({
        action: 'pause',
        pOrderId: selectedOrder.p_order_id,
        stationId: Number(stationId),
        pauseTypeId: typeId,
        pauseDetail: detail,
      });
      setSuccessMsg('Duraklama başladı.');
      await loadStationOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePauseEnd = async () => {
    if (!selectedOrder || !stationId) return;
    setBusy(true);
    setSuccessMsg('');
    setError('');
    try {
      await postOperatorAction({
        action: 'start',
        pOrderId: selectedOrder.p_order_id,
        stationId: Number(stationId),
      });
      setPauseModalOpen(false);
      setSuccessMsg('Duraklama bitti, süre kaydedildi.');
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
          <div className="flex items-center gap-3">
            <LiveClock className="text-slate-300" />
            <Link
              href="/station?kiosk=0"
              className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-semibold text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
            >
              Tam panel
            </Link>
          </div>
        </header>
      )}

      <div className="mb-3 flex shrink-0 items-center gap-3">
        {showConsole ? (
          <button
            type="button"
            onClick={handleBackToList}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-500/40 hover:text-white"
          >
            ← Geri
          </button>
        ) : null}
        <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          İstasyon
          {stationId ? (
            <>
              : {workstation?.station_name || '—'}{' '}
              <span className="font-mono text-slate-400">#{workstation?.station_id ?? stationId}</span>
            </>
          ) : null}
        </h1>
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

      {!showConsole && stationId ? (
        <div className="mb-2 shrink-0 rounded-xl border border-cyan-500/25 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          {iotLive ? (
            <p>
              Üretim parametreleri · {getMachineStatusLabel(iotLive.machine_status)} · overall{' '}
              <span className="font-mono font-semibold text-white">
                {iotLive.overall_count == null ? '—' : Number(iotLive.overall_count).toLocaleString('tr-TR')}
              </span>
              {iotLive.read_at || iotLive.updated_at
                ? ` · ${new Date(iotLive.read_at || iotLive.updated_at).toLocaleString('tr-TR')}`
                : ''}
            </p>
          ) : (
            <p className="text-slate-500">
              Bu istasyon için henüz IoT paketi yok. Postman: POST /api/iot, aynı station_id.
            </p>
          )}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        {showConsole ? (
          <StationRunConsole
            stationId={stationId}
            selectedOrder={selectedOrder}
            loading={loading}
            busy={busy}
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
            iotLive={iotLive}
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

      <PauseReasonModal
        open={pauseModalOpen}
        onClose={() => setPauseModalOpen(false)}
        order={selectedOrder}
        stationId={Number(stationId)}
        submitting={busy}
        onStartPause={handlePauseConfirm}
        onEndPause={handlePauseEnd}
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
