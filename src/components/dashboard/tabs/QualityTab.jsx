'use client';

import Link from 'next/link';
import { ModuleIcon } from '@/components/dashboard/dashboardIcons';
import { DetailLink, KpiCard, SectionCard } from '@/components/dashboard/dashboardUi';

const QUALITY_MODULES = [
  {
    id: 'incoming',
    title: 'Giriş Kalite Kontrol',
    description: 'Ham madde ve tedarikçi giriş kontrolleri',
    href: '/kalite',
    tone: 'border-rose-500/20 hover:border-rose-500/40',
    iconTone: 'text-rose-400 bg-rose-500/10',
  },
  {
    id: 'production',
    title: 'Üretim Kalite Kontrol',
    description: 'Proses içi ve hat sonu kontrol kayıtları',
    href: '/kalite',
    tone: 'border-violet-500/20 hover:border-violet-500/40',
    iconTone: 'text-violet-400 bg-violet-500/10',
  },
  {
    id: 'ncr',
    title: 'Uygunsuzluklar',
    description: 'NCR, CAPA ve düzeltici faaliyet takibi',
    href: '/kalite',
    tone: 'border-amber-500/20 hover:border-amber-500/40',
    iconTone: 'text-amber-400 bg-amber-500/10',
  },
  {
    id: 'calibration',
    title: 'Kalibrasyon',
    description: 'Ölçüm cihazları ve kalibrasyon planı',
    href: '/kalite',
    tone: 'border-sky-500/20 hover:border-sky-500/40',
    iconTone: 'text-sky-400 bg-sky-500/10',
  },
];

export default function QualityTab({ snapshot, loading }) {
  const quality = snapshot?.quality;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Fire satırı"
          value={quality?.scrapLines ?? 0}
          hint="Operatör bitir kayıtları"
          tone={(quality?.scrapLines ?? 0) > 0 ? 'text-rose-300' : 'text-white'}
          loading={loading}
        />
        <KpiCard
          label="Fire adedi"
          value={quality?.scrapTotal ?? 0}
          hint="Toplam fire miktarı"
          tone={(quality?.scrapTotal ?? 0) > 0 ? 'text-rose-300' : 'text-white'}
          loading={loading}
        />
        <KpiCard
          label="Açık uygunsuzluk"
          value="—"
          hint="Modül hazırlanıyor"
          tone="text-slate-400"
          loading={loading}
        />
        <KpiCard
          label="Kalibrasyon"
          value="—"
          hint="Modül hazırlanıyor"
          tone="text-slate-400"
          loading={loading}
        />
      </div>

      <SectionCard title="Kalite modülleri" action={<DetailLink href="/kalite" label="Kalite merkezi →" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          {QUALITY_MODULES.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className={`group rounded-xl border bg-slate-950/40 p-4 transition-colors ${module.tone}`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2.5 ${module.iconTone}`}>
                  <ModuleIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white group-hover:text-rose-200">{module.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{module.description}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    Yakında aktif
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Son fire kayıtları">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Yükleniyor...</p>
        ) : (snapshot?.recentScrap || []).length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Fire kaydı bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Adet</th>
                  <th className="pb-2 text-right font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {snapshot.recentScrap.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 font-mono text-rose-300">{row.quantity ?? '—'}</td>
                    <td className="py-2.5 text-right text-slate-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('tr-TR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
