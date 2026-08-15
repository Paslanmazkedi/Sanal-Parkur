'use client';

import { OPERATOR_ACTIONS, getActionDisabledReason } from '@/lib/operatorConstants';
import OeeMetricBar from '@/components/station/OeeMetricBar';
import StationOrderCard from '@/components/station/StationOrderCard';
import { getOeeTextClass } from '@/lib/oee';
import { getStageMeta } from '@/lib/stationStages';

const actionStyles = {
  control: 'border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20',
  start: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20',
  pause: 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20',
  finish: 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
};

export default function StationCommandPanel({
  stationId,
  workstation,
  activeWorkers,
  activeOrderCount,
  metrics,
  selectedOrder,
  loading,
  busy,
  clock,
  onAction,
  onOpenTimeEntry,
  touchFriendly = false,
  blockingOrder = null,
}) {
  const currentStage = selectedOrder ? Number(selectedOrder.is_stage) : null;
  const stageMeta = selectedOrder ? getStageMeta(selectedOrder.is_stage) : null;

  const actionButtonClass = touchFriendly
    ? 'min-h-12 rounded-xl border px-5 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'
    : 'rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/40 px-5 py-4">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-300">İşlem Paneli</h2>
        {clock && (
          <div className="text-right">
            <p className="font-mono text-lg font-bold text-white">{clock}</p>
            <p className="text-[10px] text-slate-500">Canlı saat</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 border-b border-slate-800 p-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {workstation ? (
            <>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80">Seçili istasyon</p>
                <p className="mt-1 text-xl font-bold text-white">{workstation.station_name}</p>
                <p className="font-mono text-sm text-emerald-400">#{workstation.station_id}</p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-500">Durum</dt>
                  <dd className="mt-0.5">
                    <span
                      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${
                        workstation.active !== 0
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-600/30 bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {workstation.active !== 0 ? 'Aktif' : 'Pasif'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-500">Şube / Dept.</dt>
                  <dd className="mt-0.5 text-slate-300">
                    {workstation.branch || '—'} · {workstation.department || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-500">Aktif emir</dt>
                  <dd className="mt-0.5 font-bold text-sky-300">{activeOrderCount}</dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-[10px] uppercase tracking-wider text-slate-500">Aktif çalışanlar</dt>
                  <dd className="mt-0.5 text-slate-300">
                    {activeWorkers.length > 0 ? activeWorkers.join(', ') : 'Kayıt yok — zaman girişi ile eklenir'}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-500">İstasyon bulunamadı — panoya dönüp tekrar seçin.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Anlık OEE</p>
          <p className={`mt-1 text-4xl font-black ${getOeeTextClass(metrics?.oee ?? 0)}`}>
            {metrics?.oee ?? 0}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Seçili emir bazında (MVP)</p>
          <div className="mt-4 space-y-2.5">
            <OeeMetricBar label="Availability" value={metrics?.availability ?? 0} tone="sky" />
            <OeeMetricBar label="Performance" value={metrics?.performance ?? 0} tone="emerald" />
            <OeeMetricBar label="Quality" value={metrics?.quality ?? 0} tone="amber" />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">Seçili Emir</h3>
          {stageMeta && (
            <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${stageMeta.className}`}>
              {stageMeta.label}
            </span>
          )}
        </div>

        {loading && !selectedOrder ? (
          <p className="py-10 text-center text-sm text-slate-500">Yükleniyor...</p>
        ) : selectedOrder ? (
          <StationOrderCard order={selectedOrder} highlight />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 py-10 text-center text-sm text-slate-500">
            Aşağıdaki listeden bir emir seçin. Başlat, duraklat ve sonuç gir bu emir için uygulanır.
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-[10px] font-mono uppercase tracking-wider text-slate-500">Emir işlemleri</p>
          <div className="flex flex-wrap gap-2">
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
                  className={`${actionButtonClass} ${actionStyles[action]}`}
                >
                  {config.label}
                </button>
              );
            })}
            <button
              type="button"
              disabled={!selectedOrder || busy || !stationId}
              onClick={onOpenTimeEntry}
              className={`${actionButtonClass} border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Zaman Harcaması
            </button>
          </div>
          {!selectedOrder && stationId && (
            <p className="mt-3 text-xs text-amber-400/90">Önce kuyruk veya park listesinden emir seçin.</p>
          )}
          {blockingOrder && selectedOrder && Number(selectedOrder.p_order_id) !== Number(blockingOrder.p_order_id) && (
            <p className="mt-3 text-xs text-amber-400/90">
              {blockingOrder.p_order_no} üretimde. Yeni emir için önce duraklatın veya sonuç girin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
