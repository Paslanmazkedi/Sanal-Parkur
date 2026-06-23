'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardSection from '@/components/dashboard/DashboardSection';
import { PRODUCTION_LINKS, SECTION_HREFS } from '@/lib/navigation';
import { loadDashboardSnapshot } from '@/lib/dashboardMetrics';
import { getStageMeta } from '@/lib/stationStages';
import { supabase } from '../supabase';

function QuickLinkCard({ href, label, description }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4 transition-colors hover:border-emerald-500/30 hover:bg-slate-900"
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
    </Link>
  );
}

function StatCard({ label, value, tone = 'text-white' }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

const PRODUCTION_DESCRIPTIONS = {
  '/uretim': 'Üretim alanı genel bakış',
  '/oee': 'İstasyon verimliliği ve OEE',
  '/station': 'Operatör ekranı ve saha işlemleri',
  '/production-orders': 'Aktif ve bekleyen emirler',
  '/assets': 'İstasyon tanımları',
  '/logs': 'Sanal Parkur entegrasyon logları',
};

export default function ProductionHubPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await loadDashboardSnapshot(supabase);
      setSnapshot(data);
      setLoading(false);
    };

    load();
  }, []);

  const production = snapshot?.production;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">Üretim</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">Üretim Özeti</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Emirler ve saha operasyonları. Workcube W3 entegrasyonu için{' '}
          <Link href={SECTION_HREFS.iot} className="text-violet-400 hover:underline">
            IoT Entegrasyon
          </Link>{' '}
          menüsüne bakın.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam emir" value={loading ? '—' : (production?.totalOrders ?? 0)} />
        <StatCard
          label="Aktif emir"
          value={loading ? '—' : (production?.activeOrders ?? 0)}
          tone="text-emerald-400"
        />
        <StatCard
          label="Üretimde istasyon"
          value={loading ? '—' : (production?.runningStations ?? 0)}
          tone="text-sky-400"
        />
        <StatCard
          label="Kuyrukta"
          value={loading ? '—' : (production?.queueOrders ?? 0)}
          tone="text-amber-300"
        />
      </div>

      <DashboardSection title="Üretim Modülleri" description="Saha ve planlama ekranları">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTION_LINKS.filter((link) => link.href !== '/uretim').map((link) => (
            <QuickLinkCard
              key={link.href}
              href={link.href}
              label={link.label}
              description={PRODUCTION_DESCRIPTIONS[link.href] || 'Üretim modülü'}
            />
          ))}
        </div>
      </DashboardSection>

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
                <div
                  key={order.p_order_id}
                  className="flex items-center justify-between gap-3 bg-slate-900/30 px-4 py-3"
                >
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
    </div>
  );
}
