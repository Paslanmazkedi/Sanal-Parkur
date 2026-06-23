'use client';

import Link from 'next/link';
import DashboardSection from '@/components/dashboard/DashboardSection';
import { IOT_TOOLS_LINKS, SECTION_HREFS, W3_LINKS } from '@/lib/navigation';

const W3_DESCRIPTIONS = {
  '/iot-entegrasyon/uretim-emirleri': 'Workcube üretim emirleri W3 API üzerinden',
  '/iot-entegrasyon/istasyonlar': 'Workcube istasyon tanımları W3 API üzerinden',
  '/iot-entegrasyon/operator-paneli': 'Operatör işlemleri W3 API üzerinden',
  '/iot-entegrasyon/loglar': 'WEX entegrasyon logları W3 API üzerinden',
};

const TOOL_DESCRIPTIONS = {
  '/simulator': 'PLC/WEX sinyal testi ve makine gönderimi',
  '/iot-gateway': 'Canlı operasyon ve sinyal akışı',
  '/lot-records': 'Lot bazlı üretim kayıtları',
};

function ModuleCard({ href, label, description, badge }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4 transition-colors hover:border-violet-500/30 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white">{label}</p>
        {badge && (
          <span className="shrink-0 rounded border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
    </Link>
  );
}

export default function IotIntegrationHubPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-violet-400">IoT Entegrasyon</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">IoT Entegrasyon Özeti</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Workcube WEX/W3 entegrasyon modülleri ve Sanal Parkur IoT araçları.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-violet-500/20 bg-slate-900/50 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Entegrasyon</p>
          <p className="mt-2 text-lg font-bold text-violet-300">Workcube W3 / WEX</p>
          <p className="mt-1 text-xs text-slate-500">API key ile veri kaynağı bağlantısı planlandı</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Durum</p>
          <p className="mt-2 text-lg font-bold text-amber-300">Yapılandırma bekliyor</p>
          <p className="mt-1 text-xs text-slate-500">W3 modülleri placeholder olarak hazır</p>
        </div>
      </div>

      <DashboardSection title="Workcube W3 Modülleri" description="WEX entegrasyon ekranları">
        <div className="grid gap-3 sm:grid-cols-2">
          {W3_LINKS.map((link) => (
            <ModuleCard
              key={link.href}
              href={link.href}
              label={link.label}
              description={W3_DESCRIPTIONS[link.href]}
              badge="W3"
            />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="IoT Araçları" description="Sanal Parkur test ve izleme araçları">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IOT_TOOLS_LINKS.map((link) => (
            <ModuleCard
              key={link.href}
              href={link.href}
              label={link.label}
              description={TOOL_DESCRIPTIONS[link.href]}
            />
          ))}
        </div>
      </DashboardSection>

      <Link href={SECTION_HREFS.general} className="text-sm text-emerald-400 hover:underline">
        ← Genel özete dön
      </Link>
    </div>
  );
}
