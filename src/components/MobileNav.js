'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import {
  IOT_LINKS,
  MOBILE_TABS,
  MORE_MENU_SECTIONS,
  PRODUCTION_LINKS,
  isExactOrNestedPath,
  isSectionActive,
} from '../lib/navigation';

function TabIcon({ sectionKey, active }) {
  const className = `h-5 w-5 ${active ? 'text-emerald-400' : 'text-current'}`;

  if (sectionKey === 'general') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
      </svg>
    );
  }

  if (sectionKey === 'production') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }

  if (sectionKey === 'quality') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l7 4v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V7l7-4z" />
        <path d="m9.5 12 2 2 4-4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState('');

  const menuPaths = [...PRODUCTION_LINKS, ...IOT_LINKS].map((item) => item.href);
  const menuTabActive = menuPaths.some((href) => isExactOrNestedPath(pathname, href));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user || !isMounted) return;

      const { data } = await supabase
        .schema('public')
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (isMounted && data?.full_name) {
        setProfileName(data.full_name);
      }
    };

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setProfileName('');
        return;
      }

      const { data } = await supabase
        .schema('public')
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data?.full_name) {
        setProfileName(data.full_name);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

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

          <div
            className="absolute inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-y-auto rounded-t-2xl border-t border-slate-700 bg-slate-900 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-600" />

            {MORE_MENU_SECTIONS.map((section) => (
              <div key={section.title} className="mb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
                <nav className="space-y-1">
                  {section.links.map((link) => {
                    const active = isExactOrNestedPath(pathname, link.href);

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
              </div>
            ))}

            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hesap</p>
            <p className="mb-4 truncate text-sm font-medium text-slate-100">
              {profileName || 'Kullanıcı'}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl border border-slate-700 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white"
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
          {MOBILE_TABS.map((tab) => {
            const active = isSectionActive(pathname, tab.key);

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TabIcon sectionKey={tab.key} active={active} />
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
              menuOpen || menuTabActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
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
