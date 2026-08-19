'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardSection from '@/components/dashboard/DashboardSection';
import PageHeader from '@/components/PageHeader';
import { SECTION_HREFS } from '@/lib/navigation';
import { loadDashboardSnapshot } from '@/lib/dashboardMetrics';
import { supabase } from '../supabase';

export default function QualityHubPage() {
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

  const quality = snapshot?.quality;

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <PageHeader
        title="Kalite Özeti"
        titleClassName="text-rose-100"
        crumbs={[{ label: 'Kalite' }, { label: 'Kalite Özeti' }]}
        description="Fire kayıtları ve kalite kontrol metrikleri."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-rose-500/20 bg-slate-900/50 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Fire satırı</p>
          <p className="mt-2 text-2xl font-black text-rose-300">
            {loading ? '—' : (quality?.scrapLines ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-slate-900/50 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Fire adedi</p>
          <p className="mt-2 text-2xl font-black text-rose-300">
            {loading ? '—' : (quality?.scrapTotal ?? 0)}
          </p>
        </div>
      </div>

      <DashboardSection title="Kalite İşlemleri" description="Saha ve kontrol ekranları">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/station"
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4 transition-colors hover:border-rose-500/30"
          >
            <p className="text-sm font-semibold text-white">Operatör Paneli</p>
            <p className="mt-1 text-xs text-slate-500">Bitir ekranı ve fire girişleri</p>
          </Link>
          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-4 text-sm text-slate-500">
            Kalite kontrol modülleri genişletilmeye hazır.
          </div>
        </div>
      </DashboardSection>

      <Link href={SECTION_HREFS.general} className="text-sm text-emerald-400 hover:underline">
        ← Genel özete dön
      </Link>
    </div>
  );
}
