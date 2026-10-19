'use client';

import { useState } from 'react';
import { OPERATOR_ACTIONS, getActionDisabledReason } from '@/lib/operatorConstants';
import { getStageMeta } from '@/lib/stationStages';
import {
  getIotCycleTime,
  getIotEyeCount,
  getIotJobCount,
  getIotMachineSpeed,
  getMachineStatusLabel,
  livePayloadRows,
} from '@/lib/iotStation';

const actionStyles = {
  control: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  start: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  pause: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  finish: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
};

function formatMetric(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('tr-TR');
}

function formatPacketStamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function WindowOrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v11" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function OrderPickRow({ order, selected, onSelect, liveCount }) {
  const stage = getStageMeta(order.is_stage);
  const produced = liveCount != null && [1, 3].includes(Number(order.is_stage)) ? liveCount : Number(order.counter_value) || 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className={`flex w-full min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left ${
        selected
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-sm font-semibold text-white">{order.p_order_no}</p>
        <p className="truncate text-[11px] text-slate-400">{order.product_name2}</p>
      </div>
      <div className="ml-2 shrink-0 text-right">
        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${stage.className}`}>
          {stage.label}
        </span>
        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
          {produced}/{order.quantity ?? 0}
        </p>
      </div>
    </button>
  );
}

function ScoreCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-900/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums tracking-tight text-white sm:text-2xl">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function StationRunConsole({
  stationId,
  selectedOrder,
  loading,
  busy,
  onAction,
  onOpenTimeEntry,
  blockingOrder,
  activeOrders,
  queueOrders,
  onSelectOrder,
  iotLive,
}) {
  const [showOtherOrders, setShowOtherOrders] = useState(false);
  const [showProcess, setShowProcess] = useState(false);

  const currentStage = selectedOrder ? Number(selectedOrder.is_stage) : null;
  const stageMeta = selectedOrder ? getStageMeta(selectedOrder.is_stage) : null;
  const target = Number(selectedOrder?.quantity) || 0;
  const jobCount = getIotJobCount(iotLive);
  const produced = jobCount != null ? jobCount : Number(selectedOrder?.counter_value) || 0;
  const remaining = target > 0 ? Math.max(0, target - produced) : null;
  const progress = target > 0 ? Math.min(100, (produced / target) * 100) : 0;
  const allOrders = [...activeOrders, ...queueOrders];
  const packetStamp = formatPacketStamp(iotLive?.read_at || iotLive?.updated_at);
  const processRows = [
    ...(packetStamp ? [{ key: 'SON_PAKET', value: packetStamp }] : []),
    ...livePayloadRows(iotLive?.payload),
  ];
  const machineStatus = iotLive?.machine_status;
  const statusLabel = getMachineStatusLabel(machineStatus);
  const eyeCount = getIotEyeCount(iotLive);
  const cycleTime = getIotCycleTime(iotLive);
  const machineSpeed = getIotMachineSpeed(iotLive);

  const actionClass =
    'min-h-11 flex-1 rounded-xl border px-1.5 text-[12px] font-semibold leading-tight transition-colors sm:text-sm disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-3 sm:px-4">
        {selectedOrder ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <p className="truncate font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {selectedOrder.p_order_no}
              </p>
              {stageMeta ? (
                <span className={`rounded-lg border px-2 py-1 text-xs font-semibold sm:text-sm ${stageMeta.className}`}>
                  {stageMeta.label}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 truncate text-sm text-slate-300">{selectedOrder.product_name2 || '—'}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-semibold tabular-nums text-slate-200 sm:text-base">
                  {formatMetric(produced)} / {target ? formatMetric(target) : '—'}
                </p>
                {remaining !== null ? (
                  <p className="font-mono text-xs tabular-nums text-slate-400 sm:text-sm">Kalan {formatMetric(remaining)}</p>
                ) : null}
              </div>
            </div>
          </>
        ) : loading ? (
          <p className="text-sm text-slate-500">Yükleniyor...</p>
        ) : (
          <p className="text-sm text-slate-500">Listeden emir seçin.</p>
        )}
      </div>

      <div className="shrink-0 rounded-2xl border border-cyan-500/25 bg-slate-950/70 px-3 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90">IoT kutu</p>
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
              Number(machineStatus) === 2
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : Number(machineStatus) === 1
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-slate-600 bg-slate-800 text-slate-300'
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="mt-2.5 flex items-stretch gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
            <ScoreCard label="Göz sayısı" value={formatMetric(eyeCount)} hint="Yakında" />
            <ScoreCard
              label="Çevrim süresi"
              value={cycleTime == null ? '—' : `${formatMetric(cycleTime)} sn`}
            />
            <ScoreCard label="MACHINE_SPEED" value={formatMetric(machineSpeed)} />
          </div>
          <button
            type="button"
            onClick={() => setShowProcess((open) => !open)}
            className="w-[5.75rem] shrink-0 rounded-xl border border-slate-700 px-1.5 text-center text-[11px] font-semibold leading-tight text-slate-300 hover:border-cyan-500/40 sm:w-28 sm:text-xs"
          >
            {showProcess ? 'Parametre detayı gizle' : 'Parametre detay'}
          </button>
        </div>
        {showProcess ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            {processRows.length === 0 ? (
              <p className="col-span-2 text-[11px] text-slate-500 sm:col-span-5">Payload henüz yok.</p>
            ) : (
              processRows.map((row) => (
                <div key={row.key} className="rounded-md border border-slate-800 px-2 py-1">
                  <p className="truncate text-[9px] text-slate-500">{row.key === 'SON_PAKET' ? 'Son paket' : row.key}</p>
                  <p className="font-mono text-xs text-slate-200">{row.value}</p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div
        className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 ${
          showOtherOrders || !selectedOrder ? 'flex-1' : 'shrink-0'
        }`}
      >
        <button
          type="button"
          onClick={() => setShowOtherOrders((open) => !open)}
          aria-expanded={showOtherOrders || !selectedOrder}
          className="flex min-h-11 w-full shrink-0 items-center gap-2 px-3 py-2 text-left text-slate-200 hover:bg-slate-800/40"
        >
          <span className="relative shrink-0 text-cyan-300">
            <WindowOrdersIcon />
            {allOrders.length > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-cyan-500 px-1 text-center text-[9px] font-bold leading-4 text-slate-950">
                {allOrders.length}
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">Kuyruk Üretim Emirleri</span>
          <ChevronIcon open={showOtherOrders || !selectedOrder} />
        </button>
        {showOtherOrders || !selectedOrder ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-slate-800 p-2">
            {allOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Bu hatta açık emir yok.</p>
            ) : (
              <div className="space-y-1.5">
                {allOrders.map((order) => (
                  <OrderPickRow
                    key={order.p_order_id}
                    order={order}
                    selected={selectedOrder?.p_order_id === order.p_order_id}
                    onSelect={(o) => onSelectOrder(o.p_order_id)}
                    liveCount={jobCount}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {showOtherOrders || !selectedOrder ? null : <div className="min-h-0 flex-1" />}

      <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-2">
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
          {Object.entries(OPERATOR_ACTIONS).map(([action, config]) => {
            const disabledReason = getActionDisabledReason(action, currentStage, Boolean(selectedOrder), {
              blockingOrder,
            });
            return (
              <button
                key={action}
                type="button"
                disabled={Boolean(disabledReason) || busy || !stationId}
                title={disabledReason || config.label}
                onClick={() => onAction(action)}
                className={`${actionClass} ${actionStyles[action]}`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!selectedOrder || busy || !stationId}
          onClick={onOpenTimeEntry}
          className="mt-1.5 min-h-10 w-full rounded-xl border border-violet-500/40 bg-violet-500/10 text-sm font-semibold text-violet-200 disabled:opacity-35"
        >
          Zaman Harcaması
        </button>
        {blockingOrder && selectedOrder && Number(selectedOrder.p_order_id) !== Number(blockingOrder.p_order_id) ? (
          <p className="mt-1.5 px-1 text-[11px] text-amber-400/90">
            {blockingOrder.p_order_no} üretimde. Yeni emir için duraklatın veya sonuç girin.
          </p>
        ) : null}
      </div>
    </div>
  );
}
