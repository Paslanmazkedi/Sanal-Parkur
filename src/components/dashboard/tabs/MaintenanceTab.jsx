'use client';

import {
  DetailLink,
  EmptyBlock,
  HealthScore,
  KpiCard,
  SectionCard,
} from '@/components/dashboard/dashboardUi';

export default function MaintenanceTab({ workcube, snapshot, loading }) {
  const service = snapshot?.service;
  const production = snapshot?.production;
  const w3 = workcube?.production;
  const maintenanceItems = snapshot?.maintenanceItems || [];
  const stationHealth = (w3?.stationStatuses || []).slice(0, 6);

  const plannedThisWeek = maintenanceItems.length + (service?.maintenanceMachines ?? 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Bu hafta planlı"
          value={plannedThisWeek}
          hint="Kayıtlı bakım ve arıza kalemleri"
          tone="text-sky-300"
          loading={loading}
        />
        <KpiCard
          label="MTBF"
          value="—"
          hint="Arızalar arası ort. süre — veri bekleniyor"
          tone="text-slate-400"
          loading={loading}
        />
        <KpiCard
          label="MTTR"
          value="—"
          hint="Ort. onarım süresi — veri bekleniyor"
          tone="text-slate-400"
          loading={loading}
        />
        <KpiCard
          label="Aktif alarm"
          value={w3?.activeAlarms ?? production?.faultOrders ?? 0}
          hint="Duraklatılmış üretim emirleri"
          tone={(w3?.activeAlarms ?? production?.faultOrders ?? 0) > 0 ? 'text-rose-300' : 'text-white'}
          loading={loading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Bakım planı" action={<DetailLink href="/servis" />}>
          {loading ? (
            <EmptyBlock message="Bakım verileri yükleniyor..." />
          ) : maintenanceItems.length === 0 ? (
            <EmptyBlock message="Planlı bakım veya açık arıza kaydı yok." />
          ) : (
            <ul className="divide-y divide-slate-800/80">
              {maintenanceItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.stationId ? `İstasyon #${item.stationId}` : 'Genel'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === 'Bakımda'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="İstasyon sağlık skoru"
          action={<DetailLink href="/iot-entegrasyon/istasyonlar" label="İstasyonlar →" />}
        >
          {loading ? (
            <EmptyBlock message="Sağlık skoru hesaplanıyor..." />
          ) : stationHealth.length === 0 ? (
            <EmptyBlock message="Workcube istasyon verisi gerekli." />
          ) : (
            <ul className="space-y-4">
              {stationHealth.map((station) => (
                <li key={station.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-white">{station.name}</p>
                    {!station.isActive && (
                      <span className="shrink-0 text-[10px] text-slate-500">Pasif</span>
                    )}
                  </div>
                  <HealthScore score={station.healthScore} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Makina durum özeti">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-2xl font-black text-emerald-300">{service?.activeMachines ?? 0}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Aktif</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-2xl font-black text-amber-300">{service?.maintenanceMachines ?? 0}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Bakımda</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-2xl font-black text-rose-300">{service?.offlineMachines ?? 0}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Offline</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
