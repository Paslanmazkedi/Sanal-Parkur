'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';

const PRIMARY_TABS = [
  {
    href: '/',
    label: 'Panel',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/production-orders',
    label: 'Emirler',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    href: '/assets',
    label: 'İstasyon',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    href: '/logs',
    label: 'Loglar',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
];

const MORE_LINKS = [
  { href: '/simulator', label: 'PLC Simülatörü' },
  { href: '/iot-gateway', label: 'IoT Gateway' },
];

function isTabActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState('');

  const moreTabActive = MORE_LINKS.some((link) => isTabActive(pathname, link.href));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .schema('public')
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.full_name) {
        setProfileName(data.full_name);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const displayName = profileName || user?.email || 'Kullanıcı';

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-slate-700 bg-slate-900 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-600" />

            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Kullanıcı</p>
            <p className="mb-4 truncate text-sm font-medium text-slate-100">{displayName}</p>

            <nav className="space-y-1">
              {MORE_LINKS.map((link) => {
                const active = isTabActive(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex h-11 items-center rounded-xl px-4 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-emerald-600/20 text-emerald-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl border border-slate-700 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid h-16 grid-cols-5">
          {PRIMARY_TABS.map((tab) => {
            const active = isTabActive(pathname, tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.icon(active)}
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
              menuOpen || moreTabActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-[10px] font-semibold leading-none">Menü</span>
          </button>
        </div>
      </nav>
    </>
  );
}
