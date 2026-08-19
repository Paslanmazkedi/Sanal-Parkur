'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import BrandLogo from './BrandLogo';
import { useSidebar } from '@/hooks/useSidebar';
import {
  HOME_LABEL,
  PRODUCTION_LINKS,
  REPORTS_LINKS,
  REPORTS_SECTION_LABEL,
  SECTION_HREFS,
  WEX_LAB_LINKS,
  WEX_LAB_SECTION_LABEL,
  isExactOrNestedPath,
} from '../lib/navigation';

export default function Sidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const { open, close } = useSidebar();

  const [profileName, setProfileName] = useState('');
  const [currentUser, setCurrentUser] = useState(user ?? null);

  const [productionOpen, setProductionOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [wexLabOpen, setWexLabOpen] = useState(false);

  const displayName = profileName || currentUser?.email || 'Kullanıcı';

  useEffect(() => {
    setCurrentUser(user ?? null);
  }, [user]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (!session?.user) setProfileName('');
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setProfileName('');
        return;
      }

      const metadataName =
        currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || '';

      const { data } = await supabase
        .schema('public')
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle();

      setProfileName(data?.full_name || metadataName || '');
    };

    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    close();
    router.replace('/login');
  };

  const NavLink = ({ href, children, nested = false }) => {
    const isActive = isExactOrNestedPath(pathname, href);

    return (
      <Link
        href={href}
        onClick={close}
        className={`
          flex items-center font-medium rounded-lg transition-all duration-200
          ${nested ? 'h-9 pl-4 pr-3 text-[12px]' : 'h-10 pl-4 pr-3 text-[13px]'}
          ${isActive ? 'bg-emerald-600 text-emerald-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'}
        `}
      >
        {children}
      </Link>
    );
  };

  const TopNavLink = ({ href, children }) => {
    const isActive = href === SECTION_HREFS.general
      ? pathname === '/'
      : isExactOrNestedPath(pathname, href);

    return (
      <Link
        href={href}
        onClick={close}
        className={`
          flex w-full items-center px-3 py-3 rounded-lg text-xs font-semibold
          tracking-wide transition-all duration-200
          ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
        `}
      >
        {children}
      </Link>
    );
  };

  const GroupButton = ({ label, isOpen, onToggle, nested = false, tone = 'default' }) => {
    const labelClass =
      tone === 'violet'
        ? 'text-[11px] text-violet-400 group-hover:text-violet-300'
        : nested
          ? 'text-[11px] text-slate-400'
          : 'text-xs text-slate-300';

    const chevronClass =
      tone === 'violet'
        ? isOpen
          ? 'rotate-90 text-violet-400'
          : 'text-violet-500/70'
        : isOpen
          ? 'rotate-90 text-emerald-400'
          : 'text-slate-500';

    const hoverClass = tone === 'violet' ? 'hover:bg-violet-950/20' : 'hover:bg-slate-800';

    return (
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-lg transition-all duration-200 group ${hoverClass} ${
          nested ? 'px-3 py-2.5' : 'px-3 py-3'
        }`}
      >
        <span className={`font-semibold tracking-wide group-hover:text-white ${labelClass}`}>
          {label}
        </span>
        <span className={`text-sm transition-transform duration-200 ${chevronClass}`}>▸</span>
      </button>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label="Menüyü kapat"
        onClick={close}
        className={`
          fixed inset-0 z-40 hidden bg-slate-950/60 backdrop-blur-[1px] transition-opacity duration-200 lg:block
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      <aside
        className={`
          fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col justify-between
          border-r border-slate-700 bg-slate-900 px-4 py-5 shadow-2xl shadow-black/40
          transition-transform duration-200 ease-out lg:flex
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-hidden={!open}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mb-6 flex items-start justify-between gap-2 border-b border-slate-700 px-2 pb-4">
            <BrandLogo size="md" />
            <button
              type="button"
              onClick={close}
              className="mt-0.5 rounded-md border border-slate-700 p-1.5 text-slate-400 transition hover:border-slate-500 hover:text-white"
              aria-label="Menüyü kapat"
              title="Kapat"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            <TopNavLink href={SECTION_HREFS.general}>{HOME_LABEL}</TopNavLink>

            <div>
              <GroupButton
                label="Üretim"
                isOpen={productionOpen}
                onToggle={() => setProductionOpen((value) => !value)}
              />
              {productionOpen && (
                <div className="space-y-1 pl-2">
                  {PRODUCTION_LINKS.map((link) => (
                    <NavLink key={link.href} href={link.href}>
                      {link.label}
                    </NavLink>
                  ))}

                  <div className="pt-1">
                    <GroupButton
                      label={WEX_LAB_SECTION_LABEL}
                      isOpen={wexLabOpen}
                      onToggle={() => setWexLabOpen((value) => !value)}
                      nested
                      tone="violet"
                    />
                    {wexLabOpen && (
                      <div className="space-y-1 pl-2">
                        {WEX_LAB_LINKS.map((link) => (
                          <NavLink key={link.href} href={link.href} nested>
                            {link.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <GroupButton
                label="Kalite"
                isOpen={qualityOpen}
                onToggle={() => setQualityOpen((value) => !value)}
              />
              {qualityOpen && (
                <div className="space-y-1 pl-2">
                  <NavLink href={SECTION_HREFS.quality}>Kalite Özeti</NavLink>
                  <p className="px-4 py-2 text-[12px] italic text-slate-500">Modül genişletiliyor...</p>
                </div>
              )}
            </div>

            <div>
              <GroupButton
                label="Servis"
                isOpen={serviceOpen}
                onToggle={() => setServiceOpen((value) => !value)}
              />
              {serviceOpen && (
                <div className="space-y-1 pl-2">
                  <NavLink href={SECTION_HREFS.service}>Servis Özeti</NavLink>
                  <p className="px-4 py-2 text-[12px] italic text-slate-500">Modül genişletiliyor...</p>
                </div>
              )}
            </div>

            <div>
              <GroupButton
                label={REPORTS_SECTION_LABEL}
                isOpen={reportsOpen}
                onToggle={() => setReportsOpen((value) => !value)}
              />
              {reportsOpen && (
                <div className="space-y-1 pl-2">
                  {REPORTS_LINKS.map((link) => (
                    <NavLink key={link.href} href={link.href}>
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="mt-3 shrink-0 border-t border-slate-700/80 pt-3">
          <div className="flex items-center gap-2 px-1">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium leading-tight text-slate-200" title={displayName}>
                {displayName}
              </p>
              {profileName && currentUser?.email ? (
                <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-500" title={currentUser.email}>
                  {currentUser.email}
                </p>
              ) : null}
            </div>

            <Link
              href="/hesabim"
              onClick={close}
              title="Hesabım"
              aria-label="Hesabım"
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition ${
                isExactOrNestedPath(pathname, '/hesabim')
                  ? 'border-emerald-500/40 bg-emerald-600/20 text-emerald-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Çıkış yap"
              aria-label="Çıkış yap"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-950/30 hover:text-rose-300"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1" />
                <path d="M15 12H4" />
                <path d="M7 9l-3 3 3 3" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
