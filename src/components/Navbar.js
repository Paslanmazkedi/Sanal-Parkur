'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/hooks/useSidebar';
import { supabase } from '../supabase';

function HamburgerIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function resolveDisplayName(user, profileName) {
  return (
    profileName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    'Kullanıcı'
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { open, toggle, close } = useSidebar();
  const isAccountPage = pathname === '/hesabim';

  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;

      const nextUser = data?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfileName('');
        return;
      }

      const { data: profile } = await supabase
        .schema('public')
        .from('profiles')
        .select('full_name')
        .eq('id', nextUser.id)
        .maybeSingle();

      if (!isMounted) return;
      setProfileName(profile?.full_name || '');
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setProfileName('');
        return;
      }
      setProfileName(
        nextUser.user_metadata?.full_name || nextUser.user_metadata?.display_name || '',
      );
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Profil kaydı sonrası Navbar adını tazele
  useEffect(() => {
    let isMounted = true;

    const refreshName = async () => {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .schema('public')
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;
      setProfileName(profile?.full_name || '');
    };

    refreshName();
    return () => {
      isMounted = false;
    };
  }, [user?.id, pathname]);

  const displayName = resolveDisplayName(user, profileName);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
        <button
          type="button"
          onClick={toggle}
          className="hidden shrink-0 items-center justify-center rounded-md border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white lg:inline-flex"
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={open}
          title={open ? 'Menüyü kapat' : 'Menü'}
        >
          <HamburgerIcon open={open} />
        </button>

        <div className="min-w-0 flex-1" onClick={close}>
          <BrandLogo size="sm" showTagline={false} href="/" />
        </div>

        <div className="flex min-w-0 max-w-[55%] shrink-0 items-center gap-2 lg:hidden">
          <p className="min-w-0 truncate text-right text-xs font-medium text-slate-200" title={displayName}>
            {displayName}
          </p>
          <Link
            href="/hesabim"
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition ${
              isAccountPage
                ? 'border-emerald-500/40 bg-emerald-600/20 text-emerald-200'
                : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white'
            }`}
            aria-label="Hesabım"
            title="Hesabım"
          >
            <AccountIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
