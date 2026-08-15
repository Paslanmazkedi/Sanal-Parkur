'use client';

import { OPERATOR_ACTIONS, getActionDisabledReason } from '@/lib/operatorConstants';
import { getStageMeta } from '@/lib/stationStages';

const actionStyles = {
  control: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  start: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  pause: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  finish: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
};

function OrderPickRow({ order, selected, onSelect }) {
  const stage = getStageMeta(order.is_stage);
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
          {order.counter_value ?? 0}/{order.quantity ?? 0}
        </p>
      </div>
    </button>
  );
}

export default function StationRunConsole({
  stationId,
  workstation,
  selectedOrder,
  loading,
  busy,
  clock,
  onBack,
  onAction,
  onOpenTimeEntry,
  blockingOrder,
  activeOrders,
  queueOrders,
  onSelectOrder,
}) {
  const currentStage = selectedOrder ? Number(selectedOrder.is_stage) : null;
  const stageMeta = selectedOrder ? getStageMeta(selectedOrder.is_stage) : null;
  const target = Number(selectedOrder?.quantity) || 0;
  const actual = Number(selectedOrder?.counter_value) || 0;
  const progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const allOrders = [...activeOrders, ...queueOrders];

  const actionClass =
    'min-h-11 flex-1 rounded-xl border px-1.5 text-[12px] font-semibold leading-tight transition-colors sm:text-sm disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-white"
            >
              ← Liste
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-slate-500">
              #{workstation?.station_id ?? stationId}
              {workstation?.station_name ? ` · ${workstation.station_name}` : ''}
            </p>
            {selectedOrder ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-mono text-base font-bold text-white sm:text-lg">{selectedOrder.p_order_no}</p>
                {stageMeta ? (
                  <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${stageMeta.className}`}>
                    {stageMeta.label}
                  </span>
                ) : null}
              </div>
            ) : loading ? (
              <p className="text-sm text-slate-500">Yükleniyor...</p>
            ) : (
              <p className="text-sm text-slate-500">Listeden emir seçin.</p>
            )}
          </div>
          {clock ? <p className="hidden shrink-0 font-mono text-sm font-semibold text-slate-300 sm:block">{clock}</p> : null}
        </div>
        {selectedOrder ? (
          <>
            <p className="mt-1 truncate text-xs text-slate-300">{selectedOrder.product_name2 || '—'}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
                {actual} / {target || '—'}
              </p>
            </div>
          </>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-slate-800 bg-slate-900/40 p-2">
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
              />
            ))}
          </div>
        )}
      </div>

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
