'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardSection from '@/components/dashboard/DashboardSection';
import PageHeader from '@/components/PageHeader';
import { SECTION_HREFS } from '@/lib/navigation';
import { loadDashboardSnapshot } from '@/lib/dashboardMetrics';
import { supabase } from '../supabase';

export default function ServiceHubPage() {
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

  const service = snapshot?.service;

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <PageHeader
        title="Servis Özeti"
        titleClassName="text-sky-100"
        crumbs={[{ label: 'Servis' }, { label: 'Servis Özeti' }]}
        description="Makine, istasyon ve cihaz durumları."
      />

      {service?.moduleReady ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-sky-500/20 bg-slate-900/50 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Aktif</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">{service.activeMachines}</p>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-slate-900/50 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Offline</p>
            <p className="mt-2 text-2xl font-black text-slate-200">{service.offlineMachines}</p>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-slate-900/50 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Bakımda</p>
            <p className="mt-2 text-2xl font-black text-amber-300">{service.maintenanceMachines}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-sm text-slate-500">
          {loading ? 'Yükleniyor...' : 'Makine kayıtları tanımlandığında servis durumu burada listelenir.'}
        </div>
      )}

      <DashboardSection title="Servis İşlemleri" description="İstasyon ve cihaz yönetimi">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/iot-entegrasyon/istasyonlar"
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4 transition-colors hover:border-sky-500/30"
          >
            <p className="text-sm font-semibold text-white">İstasyonlar</p>
            <p className="mt-1 text-xs text-slate-500">İstasyon tanımları ve parametreler</p>
          </Link>
          <Link
            href="/simulator"
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4 transition-colors hover:border-sky-500/30"
          >
            <p className="text-sm font-semibold text-white">PLC Simülatörü</p>
            <p className="mt-1 text-xs text-slate-500">Cihaz ve makine testleri</p>
          </Link>
        </div>
      </DashboardSection>

      <Link href={SECTION_HREFS.general} className="text-sm text-emerald-400 hover:underline">
        ← Genel özete dön
      </Link>
    </div>
  );
}
