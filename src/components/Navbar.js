'use client';

import BrandLogo from './BrandLogo';
import { getPageTitle } from '@/lib/navigation';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const hideMobileTitle =
    pathname === '/station' || pathname === '/iot-entegrasyon/uretim-emirleri';

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
        <div className="shrink-0 lg:hidden">
          <BrandLogo size="sm" showTagline={false} />
        </div>

        <div className={`min-w-0 flex-1 ${hideMobileTitle ? 'hidden lg:block' : ''}`}>
          <h1 className="truncate text-sm font-semibold tracking-tight text-white lg:text-lg">{pageTitle}</h1>
        </div>
      </div>
    </header>
  );
}
