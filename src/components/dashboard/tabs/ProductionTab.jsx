'use client';

import Link from 'next/link';
import { KpiCard } from '@/components/dashboard/dashboardUi';
import { MiniDonut, StatusBarChart } from '@/components/dashboard/StatusCharts';
import { PRODUCTION_ORDERS_HREF } from '@/lib/navigation';
import { STAGE_CHART_ORDER, STAGE_META } from '@/lib/stationStages';
import { buildStageBreakdown } from '@/lib/workcubeDashboard';

function formatCount(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

function YellowSiren() {
  return (
    <span className="siren-wrap" aria-hidden>
      <svg viewBox="0 0 40 44" className="h-9 w-8">
        <defs>
          <clipPath id="siren-glass">
            <path d="M8 28c0-10 5.2-20 12-20s12 10 12 20H8z" />
          </clipPath>
          <radialGradient id="siren-glow" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <path d="M8 28c0-10 5.2-20 12-20s12 10 12 20H8z" fill="url(#siren-glow)" stroke="#fbbf24" strokeWidth="1.4" />
        <g clipPath="url(#siren-glass)">
          <g className="siren-rotor" style={{ transformOrigin: '20px 22px' }}>
            <path d="M20 22 L36 12 A18 18 0 0 1 36 32 Z" fill="#fef3c7" opacity="0.55" />
            <path d="M20 22 L4 32 A18 18 0 0 1 4 12 Z" fill="#f59e0b" opacity="0.18" />
          </g>
        </g>
        <circle cx="20" cy="22" r="3.2" fill="#fff7ed" />
        <rect x="7" y="28" width="26" height="4.5" rx="1.2" fill="#334155" />
        <rect x="11" y="32.5" width="18" height="3.5" rx="1" fill="#1e293b" />
      </svg>
    </span>
  );
}

function localStageBreakdown(local) {
  const counts = {
    4: local?.queueOrders ?? 0,
    0: local?.controlOrders ?? 0,
    1: local?.runningOrders ?? 0,
    3: local?.faultOrders ?? 0,
    2: local?.completedOrders ?? 0,
  };

  return STAGE_CHART_ORDER.map((stage) => ({
    stage,
    label: STAGE_META[stage].label,
    chartLabel: STAGE_META[stage].chartLabel,
    barClass: STAGE_META[stage].barClass,
    count: counts[stage] ?? 0,
  }));
}

export default function ProductionTab({
  workcube,
  snapshot,
  loading,
  orderLoading = false,
  error,
  fetchedAt,
}) {
  const w3 = workcube?.production;
  const local = snapshot?.production;

  const stageBreakdown = (workcube?.orders?.length || snapshot?.liveStages?.length)
    ? buildStageBreakdown(workcube?.orders || [], snapshot?.liveStages || [])
    : localStageBreakdown(local);
  const stageCount = (stage) =>
    Number(stageBreakdown.find((item) => Number(item.stage) === stage)?.count) || 0;

  const total = stageBreakdown.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const completed = stageCount(2);
  const running = local?.runningOrders ?? stageCount(1);
  const queue = stageCount(4);
  const control = stageCount(0);
  const paused = local?.faultOrders ?? stageCount(3);
  const runningStations = local?.runningStations ?? 0;
  const stationCount = local?.stationCount ?? w3?.totalStations ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-200">
          Workcube uyarısı: {error}. Göstergeler saha kayıtlarından okunuyor.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Saha özeti</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            label="Aktif istasyon"
            value={`${formatCount(runningStations)} / ${formatCount(stationCount)}`}
            hint="Üretimdeki hat / kayıtlı hat"
            tone="text-emerald-300"
            href="/iot-entegrasyon/istasyonlar"
            loading={loading}
          />
          <KpiCard
            label="Başladı"
            value={formatCount(running)}
            hint="Çalışan üretim emri"
            tone="text-emerald-300"
            href={PRODUCTION_ORDERS_HREF}
            loading={loading}
          />
          <KpiCard
            label="Tamamlanma"
            value={`${completionRate}%`}
            hint={`${formatCount(completed)} / ${formatCount(total)} emir`}
            tone={completionRate >= 80 ? 'text-emerald-300' : completionRate >= 40 ? 'text-amber-300' : 'text-white'}
            href={PRODUCTION_ORDERS_HREF}
            loading={orderLoading}
          />
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Arıza / Duraklama</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {!loading && paused > 0 ? <YellowSiren /> : null}
                <p className={`text-2xl font-black tabular-nums leading-none sm:text-3xl ${loading ? 'text-slate-600' : 'text-amber-300'}`}>
                  {loading ? '—' : formatCount(paused)}
                </p>
              </div>
              <Link
                href="/duraklamalar#aktif"
                className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 px-3 text-[11px] font-bold text-slate-950 transition hover:bg-amber-400"
              >
                Git
              </Link>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Aktif duruşlar</p>
          </div>
        </div>

        <div className="mt-3">
          <StatusBarChart items={stageBreakdown} loading={orderLoading && !w3} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Üretim emirleri</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Toplam emir</p>
            <div className="mt-2 flex items-center gap-3">
              <MiniDonut value={completed} total={total} color="#94a3b8" />
              <p className={`text-2xl font-black tabular-nums leading-none sm:text-3xl ${orderLoading && !w3 ? 'text-slate-600' : 'text-white'}`}>
                {orderLoading && !w3 ? '—' : formatCount(total)}
              </p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Grafikteki emirler</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bitti</p>
            <div className="mt-2 flex items-center gap-3">
              <MiniDonut value={completed} total={total} color="#ef4444" />
              <p className={`text-2xl font-black tabular-nums leading-none sm:text-3xl ${orderLoading && !w3 ? 'text-slate-600' : 'text-rose-400'}`}>
                {orderLoading && !w3 ? '—' : formatCount(completed)}
              </p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Bitti · %{completionRate}
            </p>
          </div>
          <KpiCard
            label="Başlamadı"
            value={formatCount(queue)}
            hint="Kuyrukta bekleyen"
            tone="text-sky-300"
            href={PRODUCTION_ORDERS_HREF}
            loading={orderLoading && !w3}
          />
          <KpiCard
            label="Operatöre Gönderildi"
            value={formatCount(control)}
            hint="Hazırlık / kontrol"
            tone="text-amber-300"
            href="/station"
            loading={orderLoading && !w3}
          />
        </div>
      </section>

      {fetchedAt && (
        <p className="text-right text-[10px] font-mono text-slate-600">
          Workcube son güncelleme: {new Date(fetchedAt).toLocaleString('tr-TR')}
        </p>
      )}
    </div>
  );
}
