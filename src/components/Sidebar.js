'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Sidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  const [profileName, setProfileName] = useState('');
  const [currentUser, setCurrentUser] = useState(user ?? null);

  const [productionOpen, setProductionOpen] = useState(true);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);

  const displayName = profileName || currentUser?.email || 'Kullanıcı';

  const toggleGroup = (group) => {
    setProductionOpen(group === 'production' ? !productionOpen : false);
    setServiceOpen(group === 'service' ? !serviceOpen : false);
    setQualityOpen(group === 'quality' ? !qualityOpen : false);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

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

  const NavLink = ({ href, children }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`
          flex items-center
          h-10
          pl-4
          pr-3
          text-[13px]
          font-medium
          rounded-lg
          transition-all
          duration-200
          ${
            isActive
              ? 'bg-emerald-600 text-emerald-100'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
          }
        `}
      >
        {children}
      </Link>
    );
  };

  const GroupButton = ({ label, isOpen, onToggle }) => (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-3 py-3 transition-all duration-200 hover:bg-slate-800 group"
    >
      <span className="text-xs font-semibold text-slate-300 tracking-wide group-hover:text-white">
        {label}
      </span>

      <span
        className={`text-sm transition-transform duration-200 ${
          isOpen ? 'rotate-90 text-emerald-400' : 'text-slate-500'
        }`}
      >
        ▸
      </span>
    </button>
  );

  return (
    <aside className="hidden md:flex fixed top-0 left-0 z-30 h-screen w-64 flex-col justify-between border-r border-slate-700 bg-slate-900 px-4 py-5">
      <div className="flex flex-col overflow-y-auto">
        <div className="mb-6 border-b border-slate-700 px-2 pb-4">
          <Link
            href="/login"
            className="block rounded-lg px-1 py-1 transition-colors hover:bg-slate-800/60"
          >
            <h1 className="text-[16px] font-black text-white tracking-[0.12em]">
              Work <span className="text-emerald-400">Test</span>
            </h1>

            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">
              Kontrol Odası
            </p>
          </Link>
        </div>

        <nav className="space-y-2">
          <div>
            <GroupButton
              label="Üretim"
              isOpen={productionOpen}
              onToggle={() => toggleGroup('production')}
            />

            {productionOpen && (
              <div className="space-y-1 pl-2">
                <NavLink href="/">Dashboard</NavLink>
                <NavLink href="/assets">İstasyon Konfigürasyonu</NavLink>
                <NavLink href="/production-orders">Üretim Emirleri</NavLink>
                <NavLink href="/logs">Loglar</NavLink>
                <NavLink href="/simulator">PLC Simülatörü</NavLink>
              </div>
            )}
          </div>

          <div>
            <GroupButton
              label="Servis"
              isOpen={serviceOpen}
              onToggle={() => toggleGroup('service')}
            />

            {serviceOpen && (
              <div className="py-2 pl-6 text-[12px] italic text-slate-500">
                Geliştirme aşamasında...
              </div>
            )}
          </div>

          <div>
            <GroupButton
              label="Kalite Kontrol"
              isOpen={qualityOpen}
              onToggle={() => toggleGroup('quality')}
            />

            {qualityOpen && (
              <div className="py-2 pl-6 text-[12px] italic text-slate-500">
                Geliştirme aşamasında...
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
