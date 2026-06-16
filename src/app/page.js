'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardSection from '@/components/dashboard/DashboardSection';
import { getOeeTextClass } from '@/lib/oee';
import { getStageMeta } from '@/lib/stationStages';
import { loadDashboardSnapshot } from '@/lib/dashboardMetrics';
import { supabase } from '../supabase';

const QUICK_LINKS = [
  { href: '/oee', label: 'OEE Monitör', color: 'bg-emerald-500' },
  { href: '/station', label: 'Operatör Paneli', color: 'bg-sky-500' },
  { href: '/production-orders', label: 'Üretim Emirleri', color: 'bg-violet-500' },
  { href: '/assets', label: 'İstasyonlar', color: 'bg-amber-500' },
  { href: '/logs', label: 'Loglar', color: 'bg-rose-500' },
  { href: '/simulator', label: 'Simülatör', color: 'bg-slate-500' },
];

function KpiTile({ label, value, hint, tone = 'text-white', href }) {
  const body = (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-3">
        <p className={`text-3xl font-black leading-none ${tone}`}>{value}</p>
        {hint && <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full transition-transform hover:-translate-y-0.5">
        {body}
      </Link>
    );
  }

  return body;
}

function DomainStat({ label, value, tone = 'text-white' }) {
  return (
    <div className="min-w-0 flex-1 border-l border-slate-800 pl-4 first:border-l-0 first:pl-0">
      <p className="truncate text-[11px] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function DomainOverviewCard({ title, subtitle, borderTone, href, hrefLabel, children }) {
  return (
    <article className={`rounded-xl border bg-slate-900/40 ${borderTone}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-xs text-emerald-400 hover:underline">
            {hrefLabel}
          </Link>
        )}
      </div>
      <div className="px-4 py-4">{children}</div>
    </article>
  );
}

function OutcomeBadge({ outcome }) {
  if (outcome === 'SUCCESS') {
    return (
      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        Başarılı
      </span>
    );
  }
  if (outcome === 'FAILED') {
    return (
      <span className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
        Hata
      </span>
    );
  }
  return <span className="text-xs text-slate-500">{outcome || '—'}</span>;
}

function EmptyState({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 px-4 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function QuickAccessBar() {
  return (
    <nav
      aria-label="Hızlı erişim"
      className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3"
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Hızlı Erişim
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-900"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${link.color}`} />
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = async () => {
    const data = await loadDashboardSnapshot(supabase);
    setSnapshot(data);
    setLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, []);

  const production = snapshot?.production;
  const quality = snapshot?.quality;
  const service = snapshot?.service;
  const integration = snapshot?.integration;

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-4">
      {/* ── Başlık ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">Sanal Parkur</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">Genel Özet</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Fabrika genel durumu — üretim, kalite, servis ve IoT entegrasyonu tek bakışta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Canlı
          </span>
          {lastUpdated && (
            <span className="font-mono text-xs text-slate-500">
              {lastUpdated.toLocaleTimeString('tr-TR', { hour12: false })}
            </span>
          )}
        </div>
      </header>

      <QuickAccessBar />

      {snapshot?.errors?.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          Bazı veriler yüklenemedi: {snapshot.errors.join(' · ')}
        </div>
      )}

      {/* ── Ana KPI ── */}
      <section aria-label="Ana göstergeler">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <KpiTile
            label="Aktif Emir"
            value={loading ? '—' : (production?.activeOrders ?? 0)}
            hint="Operatörde veya üretimde"
            tone="text-sky-400"
            href="/production-orders"
          />
          <KpiTile
            label="Ortalama OEE"
            value={loading ? '—' : `${production?.avgOee ?? 0}%`}
            hint={`${production?.runningStations ?? 0} istasyon üretimde`}
            tone={getOeeTextClass(production?.avgOee ?? 0)}
            href="/oee"
          />
          <KpiTile
            label="Kuyruk"
            value={loading ? '—' : (production?.queueOrders ?? 0)}
            hint={`${production?.faultOrders ?? 0} arıza / duruş`}
            tone="text-amber-400"
            href="/station"
          />
          <KpiTile
            label="Aktif İstasyon"
            value={loading ? '—' : (production?.stationCount ?? 0)}
            hint={`${production?.completedOrders ?? 0} tamamlanan emir`}
            tone="text-violet-400"
            href="/assets"
          />
        </div>
      </section>

      {/* ── Alan özeti: Üretim · Kalite · Servis · IoT ── */}
      <DashboardSection
        title="Alan Özeti"
        description="Departman bazında özet metrikler"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <DomainOverviewCard
            title="Üretim"
            subtitle="Emirler ve saha operasyonları"
            borderTone="border-emerald-500/20"
            href="/production-orders"
            hrefLabel="Emirler →"
          >
            <div className="flex flex-wrap gap-y-4">
              <DomainStat label="Toplam emir" value={production?.totalOrders ?? 0} />
              <DomainStat label="Üretimde istasyon" value={production?.runningStations ?? 0} tone="text-emerald-400" />
              <DomainStat label="İş gücü" value={`${production?.laborMinutesToday ?? 0} dk`} />
            </div>
          </DomainOverviewCard>

          <DomainOverviewCard
            title="Kalite"
            subtitle="Fire ve kalite kontrol"
            borderTone="border-rose-500/20"
            href="/station"
            hrefLabel="Operatör →"
          >
            {quality?.scrapLines > 0 ? (
              <div className="flex flex-wrap gap-y-4">
                <DomainStat label="Fire satırı" value={quality.scrapLines} tone="text-rose-300" />
                <DomainStat label="Fire adedi" value={quality.scrapTotal} tone="text-rose-300" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-500">
                Operatör bitir ekranındaki fire kayıtları burada görünür. Kalite modülü genişletilmeye hazır.
              </p>
            )}
          </DomainOverviewCard>

          <DomainOverviewCard
            title="Servis"
            subtitle="Makine ve cihaz durumu"
            borderTone="border-sky-500/20"
            href="/assets"
            hrefLabel="İstasyonlar →"
          >
            {service?.moduleReady ? (
              <div className="flex flex-wrap gap-y-4">
                <DomainStat label="Aktif" value={service.activeMachines} tone="text-emerald-300" />
                <DomainStat label="Offline" value={service.offlineMachines} />
                <DomainStat label="Bakımda" value={service.maintenanceMachines} tone="text-amber-300" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-500">
                Makine kayıtları tanımlandığında servis durumu burada listelenir.
              </p>
            )}
          </DomainOverviewCard>

          <DomainOverviewCard
            title="IoT & Entegrasyon"
            subtitle="WEX logları ve PLC sinyalleri"
            borderTone="border-violet-500/20"
            href="/logs"
            hrefLabel="Loglar →"
          >
            <div className="flex flex-wrap gap-y-4">
              <DomainStat label="Başarılı log" value={integration?.logSuccessCount ?? 0} tone="text-emerald-300" />
              <DomainStat label="Hatalı log" value={integration?.logFailedCount ?? 0} tone="text-rose-300" />
              <DomainStat label="Son PLC sinyali" value={integration?.signalCount ?? 0} tone="text-violet-300" />
            </div>
          </DomainOverviewCard>
        </div>
      </DashboardSection>

      {/* ── Saha + Yan panel ── */}
      <div className="grid gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <DashboardSection
            title="İstasyon Özeti"
            description="OEE ve anlık durum"
            action={
              <Link href="/oee" className="text-xs font-medium text-emerald-400 hover:underline">
                OEE Monitör →
              </Link>
            }
          >
            {(snapshot?.stationSummaries || []).length === 0 ? (
              <EmptyState message="İstasyon verisi bulunamadı." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">İstasyon</th>
                      <th className="px-4 py-3 font-medium">Durum</th>
                      <th className="px-4 py-3 font-medium text-right">OEE</th>
                      <th className="px-4 py-3 font-medium text-right">Kuyruk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {snapshot.stationSummaries.map((item) => {
                      const stage = item.statusStage !== null ? getStageMeta(item.statusStage) : null;
                      return (
                        <tr key={item.station.station_id} className="bg-slate-900/30 hover:bg-slate-900/60">
                          <td className="px-4 py-3">
                            <Link
                              href={`/station?station=${item.station.station_id}`}
                              className="font-medium text-white hover:text-emerald-300"
                            >
                              {item.station.station_name}
                            </Link>
                            <p className="text-xs text-slate-500">#{item.station.station_id}</p>
                          </td>
                          <td className="px-4 py-3">
                            {stage ? (
                              <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${stage.className}`}>
                                {stage.label}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">Boşta</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${getOeeTextClass(item.metrics.oee)}`}>
                            {item.metrics.oee}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">{item.queueCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="IoT Veri Akışı"
            description="Son entegrasyon logları ve PLC sinyalleri"
            action={
              <Link href="/logs" className="text-xs font-medium text-sky-400 hover:underline">
                Tüm loglar →
              </Link>
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Entegrasyon Logları</p>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Olay</th>
                      <th className="px-4 py-2">Sonuç</th>
                      <th className="px-4 py-2 text-right">Saat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {(snapshot?.recentLogs || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          Log kaydı yok.
                        </td>
                      </tr>
                    ) : (
                      snapshot.recentLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-300">
                            {log.payload?.event || '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <OutcomeBadge outcome={log.payload?.outcome} />
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-500">
                            {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour12: false })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-800">
                <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">PLC Sinyalleri</p>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Emir</th>
                      <th className="px-4 py-2">Tip</th>
                      <th className="px-4 py-2 text-right">Sayaç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {(snapshot?.recentOperations || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          Sinyal kaydı yok.
                        </td>
                      </tr>
                    ) : (
                      snapshot.recentOperations.map((op) => (
                        <tr key={op.id}>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-300">#{op.p_order_id}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                                op.type === 1
                                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              }`}
                            >
                              {op.type === 1 ? 'Giriş' : 'Çıkış'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-white">
                            {op.start_counter ?? '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </DashboardSection>
        </div>

        {/* ── Yan panel ── */}
        <aside className="xl:col-span-4">
          <DashboardSection
            title="Son Emirler"
            description="Güncel üretim emirleri"
            action={
              <Link href="/production-orders" className="text-xs font-medium text-violet-400 hover:underline">
                Tümü →
              </Link>
            }
          >
            <div className="divide-y divide-slate-800/80 overflow-hidden rounded-xl border border-slate-800">
              {(snapshot?.recentOrders || []).length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">Emir bulunamadı.</p>
              ) : (
                snapshot.recentOrders.map((order) => {
                  const stage = getStageMeta(order.is_stage);
                  return (
                    <div key={order.p_order_id} className="flex items-center justify-between gap-3 bg-slate-900/30 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-semibold text-white">{order.p_order_no}</p>
                        <p className="truncate text-xs text-slate-500">{order.product_name2}</p>
                      </div>
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${stage.className}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}
