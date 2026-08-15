'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import BrandLogo from './BrandLogo';
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

      const { data } = await supabase
        .schema('public')
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data?.full_name) {
        setProfileName(data.full_name);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const NavLink = ({ href, children, nested = false }) => {
    const isActive = isExactOrNestedPath(pathname, href);

    return (
      <Link
        href={href}
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
    <aside className="hidden lg:flex fixed top-0 left-0 z-30 h-screen w-64 flex-col justify-between border-r border-slate-700 bg-slate-900 px-4 py-5">
      <div className="flex flex-col overflow-y-auto">
        <div className="mb-6 border-b border-slate-700 px-2 pb-4">
          <BrandLogo size="md" />
        </div>

        <nav className="space-y-2">
          <TopNavLink href={SECTION_HREFS.general}>{HOME_LABEL}</TopNavLink>

          <div>
            <GroupButton
              label="Üretim"
              isOpen={productionOpen}
              onToggle={() => setProductionOpen((open) => !open)}
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
                    onToggle={() => setWexLabOpen((open) => !open)}
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
              onToggle={() => setQualityOpen((open) => !open)}
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
              onToggle={() => setServiceOpen((open) => !open)}
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
              onToggle={() => setReportsOpen((open) => !open)}
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

      <div className="mt-4 border-t border-slate-700 pt-4">
        <p className="mb-1 px-2 text-[10px] uppercase tracking-wider text-slate-400">Kullanıcı</p>
        <p className="mb-4 truncate px-2 text-sm font-medium text-slate-100">{displayName}</p>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-slate-700 py-2 text-[11px] font-bold text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-800 hover:text-white"
        >
          ÇIKIŞ YAP
        </button>
      </div>
    </aside>
  );
}
