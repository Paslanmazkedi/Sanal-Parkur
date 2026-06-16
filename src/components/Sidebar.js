'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import BrandLogo from './BrandLogo';

export default function Sidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  const [profileName, setProfileName] = useState('');
  const [currentUser, setCurrentUser] = useState(user ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [productionOpen, setProductionOpen] = useState(pathname.startsWith('/oee') || pathname.startsWith('/station') || pathname.startsWith('/production-orders') || pathname.startsWith('/logs'));
  const [serviceOpen, setServiceOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);

  const displayName = profileName || currentUser?.email || 'Kullanıcı';

  const toggleGroup = (group) => {
    setProductionOpen(group === 'production' ? !productionOpen : false);
    setServiceOpen(group === 'service' ? !serviceOpen : false);
    setQualityOpen(group === 'quality' ? !qualityOpen : false);
  };

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

  const NavLink = ({ href, children }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`
          flex items-center h-10 pl-4 pr-3 text-[13px] font-medium rounded-lg
          transition-all duration-200
          ${isActive ? 'bg-emerald-600 text-emerald-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'}
        `}
      >
        {children}
      </Link>
    );
  };

  const TopNavLink = ({ href, children }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
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

  const GroupButton = ({ label, isOpen, onToggle }) => (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 hover:bg-slate-800 group"
    >
      <span className="text-xs font-semibold text-slate-300 tracking-wide group-hover:text-white">
        {label}
      </span>
      <span
        className={`text-sm transition-transform duration-200 ${isOpen ? 'rotate-90 text-emerald-400' : 'text-slate-500'}`}
      >
        ▸
      </span>
    </button>
  );

  const sidebarContent = (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col justify-between h-full px-4 py-5">
      <div className="flex flex-col overflow-y-auto">
        <div className="mb-6 border-b border-slate-700 px-2 pb-4">
          <BrandLogo size="md" />
        </div>

        <nav className="space-y-2">
          <TopNavLink href="/">Genel Özet</TopNavLink>

          <div>
            <GroupButton
              label="Üretim"
              isOpen={productionOpen}
              onToggle={() => toggleGroup('production')}
            />
            {productionOpen && (
              <div className="space-y-1 pl-2">
                <NavLink href="/oee">OEE Monitör</NavLink>
                <NavLink href="/station">Operatör Paneli</NavLink>
                <NavLink href="/production-orders">Üretim Emirleri</NavLink>
                <NavLink href="/logs">Loglar</NavLink>
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
              <div className="pl-6 py-2 text-[12px] text-slate-500 italic">
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
              <div className="pl-6 py-2 text-[12px] text-slate-500 italic">
                Geliştirme aşamasında...
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="border-t border-slate-700 pt-4 mt-4">
        <p className="text-[10px] text-slate-400 uppercase px-2 mb-1 tracking-wider">Kullanıcı</p>
        <p className="text-sm text-slate-100 font-medium px-2 mb-4 truncate">{displayName}</p>
        <button
          onClick={handleLogout}
          className="w-full py-2 text-[11px] font-bold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-lg transition-all"
        >
          ÇIKIŞ YAP
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-md text-slate-300"
        onClick={() => setMobileOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="hidden md:block h-screen fixed top-0 left-0 z-30">{sidebarContent}</div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-screen shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
