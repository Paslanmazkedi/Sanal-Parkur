'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Sidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  const [profileName, setProfileName] = useState('');
  const [currentUser, setCurrentUser] = useState(user ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Menü Grupları
  const [productionOpen, setProductionOpen] = useState(true);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);

  const displayName = profileName || currentUser?.email || 'Kullanıcı';

  // Tek accordion açık kalsın
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
        onClick={() => setMobileOpen(false)}
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
      className="
        flex
        w-full
        items-center
        justify-between
        px-3
        py-3
        rounded-lg
        transition-all
        duration-200
        hover:bg-slate-800
        group
      "
    >
      <span
        className="
          text-xs
          font-semibold
          text-slate-300
          tracking-wide
          group-hover:text-white
        "
      >
        {label}
      </span>

      <span
        className={`
          text-sm
          transition-transform
          duration-200
          ${
            isOpen
              ? 'rotate-90 text-emerald-400'
              : 'text-slate-500'
          }
        `}
      >
        ▸
      </span>
    </button>
  );

  const sidebarContent = (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col justify-between h-full px-4 py-5">
      <div className="flex flex-col overflow-y-auto">

        {/* Logo Bölümü */}
        <div className="mb-6 px-2 pb-4 border-b border-slate-700">
          <h1 className="text-[16px] font-black text-white tracking-[0.12em]">
            Work <span className="text-emerald-400">Test</span>
          </h1>

          <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-[0.12em]">
            Kontrol Odası
          </p>
        </div>

        {/* Navigasyon */}
        <nav className="space-y-2">

          {/* Üretim */}
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

          {/* Servis */}
          <div>
            <GroupButton
              label="Servis"
              isOpen={serviceOpen}
              onToggle={() => toggleGroup('service')}
            />

            {serviceOpen && (
              <div className="pl-6 py-2 text-[12px] text-slate-500 italic">
                Geliştirme aşamasında...
              </div>
            )}
          </div>

          {/* Kalite */}
          <div>
            <GroupButton
              label="Kalite Kontrol"
              isOpen={qualityOpen}
              onToggle={() => toggleGroup('quality')}
            />

            {qualityOpen && (
              <div className="pl-6 py-2 text-[12px] text-slate-500 italic">
                Geliştirme aşamasında...
              </div>
            )}
          </div>

        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 pt-4 mt-4">
        <p className="text-[10px] text-slate-400 uppercase px-2 mb-1 tracking-wider">
          Kullanıcı
        </p>

        <p className="text-sm text-slate-100 font-medium px-2 mb-4 truncate">
          {displayName}
        </p>

        <button
          onClick={handleLogout}
          className="
            w-full
            py-2
            text-[11px]
            font-bold
            text-slate-300
            hover:text-white
            border
            border-slate-700
            hover:border-slate-500
            hover:bg-slate-800
            rounded-lg
            transition-all
          "
        >
          ÇIKIŞ YAP
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobil Hamburger */}
      <button
        className="
          md:hidden
          fixed
          top-4
          left-4
          z-50
          p-2
          bg-slate-900
          border
          border-slate-700
          rounded-lg
          shadow-md
          text-slate-300
        "
        onClick={() => setMobileOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Masaüstü */}
      <div className="hidden md:block h-screen fixed top-0 left-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobil Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative z-50 h-screen shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}