'use client';

import BrandLogo from './BrandLogo';
import { getPageTitle } from '@/lib/navigation';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3 px-4 py-3 md:px-8 md:py-4">
        <div className="shrink-0 md:hidden">
          <BrandLogo size="sm" showTagline={false} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-white md:text-lg">
            <span className="md:hidden">{pageTitle}</span>
            <span className="hidden md:inline">{pageTitle}</span>
          </h1>
        </div>
      </div>
    </header>
  );
}
