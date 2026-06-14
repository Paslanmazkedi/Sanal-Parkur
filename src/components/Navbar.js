'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_TITLES = {
  '/': 'Entegrasyon Paneli',
  '/assets': 'İstasyon Konfigürasyonu',
  '/production-orders': 'Üretim Emirleri',
  '/logs': 'Loglar',
  '/simulator': 'PLC Simülatörü',
  '/iot-gateway': 'IoT Gateway',
};

export default function Navbar() {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] || 'Wex Entegrasyon Paneli';

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3 px-4 py-3 md:px-8 md:py-4">
        <Link
          href="/login"
          className="shrink-0 rounded-lg transition-colors hover:bg-slate-800/60 md:hidden"
        >
          <span className="block text-sm font-black tracking-[0.1em] text-white">
            Work <span className="text-emerald-400">Test</span>
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-white md:text-lg">
            <span className="md:hidden">{pageTitle}</span>
            <span className="hidden md:inline">Wex Entegrasyon Paneli</span>
          </h1>
        </div>
      </div>
    </header>
  );
}
