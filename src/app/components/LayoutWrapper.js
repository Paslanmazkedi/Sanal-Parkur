'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import MobileNav from '../../components/MobileNav';
import { resolveKioskEnabled } from '@/lib/kiosk';
import { SidebarProvider } from '@/hooks/useSidebar';

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-slate-950 text-slate-100">
      <div className="text-sm font-mono text-slate-400">Oturum kontrol ediliyor...</div>
    </div>
  );
}

function AppShell({ user, children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kiosk = resolveKioskEnabled(pathname, searchParams);
  const isStationPage = pathname === '/station';

  if (kiosk) {
    return (
      <div className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="flex h-full min-h-0 w-full min-w-0 flex-col">{children}</div>
        </main>
      </div>
    );
  }

  if (isStationPage) {
    return (
      <SidebarProvider>
        <div className="h-dvh min-h-0 min-w-0 overflow-hidden bg-slate-950 text-slate-100">
          <Sidebar user={user} />

          <div className="flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden">
            <Navbar />
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-24 lg:px-6 lg:py-6 lg:pb-6">
              <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden">{children}</div>
            </main>
          </div>

          <MobileNav />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-950 text-slate-100">
        <Sidebar user={user} />

        <div className="flex min-h-screen w-full min-w-0 flex-col">
          <Navbar />
          <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-24 lg:px-6 lg:py-6 lg:pb-6">
            <div className="w-full min-w-0 max-w-full overflow-x-hidden">{children}</div>
          </main>
        </div>

        <MobileNav />
      </div>
    </SidebarProvider>
  );
}

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const clearStaleSession = async () => {
      // Eski/geçersiz refresh token localStorage'da kalınca console'a AuthApiError düşer.
      // Local scope ile sadece bu tarayıcı oturumunu temizler; sunucu tarafına dokunmaz.
      await supabase.auth.signOut({ scope: 'local' });
      if (!isMounted) return;
      setUser(null);
      setLoading(false);
    };

    const isInvalidRefreshToken = (error) => {
      if (!error) return false;
      const message = String(error.message || '');
      return (
        error.code === 'refresh_token_not_found' ||
        message.includes('Refresh Token Not Found') ||
        message.includes('Invalid Refresh Token')
      );
    };

    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (isInvalidRefreshToken(error)) {
        await clearStaleSession();
        return;
      }

      if (error) {
        console.error('Supabase session error:', error);
      }

      setUser(data?.session?.user ?? null);
      setLoading(false);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Token yenileme başarısız olunca GoTrue SIGNED_OUT üretir; local state'i hizala.
      if (event === 'TOKEN_REFRESHED' && !session) {
        await clearStaleSession();
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
      return;
    }

    if (user && isLoginPage) {
      router.replace('/');
    }
  }, [isLoginPage, loading, router, user]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user && !isLoginPage) {
    return <AuthLoadingScreen />;
  }

  if (user && isLoginPage) {
    return <AuthLoadingScreen />;
  }

  if (isLoginPage) {
    return <div className="w-full min-h-screen min-w-0 overflow-x-hidden">{children}</div>;
  }

  return <AppShell user={user}>{children}</AppShell>;
}
