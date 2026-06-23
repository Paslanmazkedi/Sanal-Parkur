import Link from 'next/link';
import { SECTION_HREFS } from '@/lib/navigation';

export default function W3PlaceholderPage({
  title,
  description = 'Bu modül Workcube WEX/W3 API entegrasyonu ile doldurulacak. Veri kaynağı ve API key ayarları sonraki adımda yapılandırılacak.',
  integrationNote = 'API key tabanlı W3 bağlantısı henüz yapılandırılmadı.',
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-violet-400">IoT Entegrasyon · Workcube W3</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
      </header>

      <div className="rounded-xl border border-dashed border-violet-500/30 bg-slate-900/40 px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-violet-300" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3v3" />
            <path d="M12 18v3" />
            <path d="M3 12h3" />
            <path d="M18 12h3" />
            <circle cx="12" cy="12" r="4" />
            <path d="M7.05 7.05 9.17 9.17" />
            <path d="M14.83 14.83 16.95 16.95" />
            <path d="M16.95 7.05 14.83 9.17" />
            <path d="M9.17 14.83 7.05 16.95" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-200">Modül hazırlanıyor</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{integrationNote}</p>
      </div>

      <Link href={SECTION_HREFS.iot} className="inline-flex text-sm text-emerald-400 hover:underline">
        ← IoT Entegrasyon özetine dön
      </Link>
    </div>
  );
}
