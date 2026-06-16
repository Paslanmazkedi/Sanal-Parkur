"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-slate-950 text-slate-100">
      <div className="text-sm font-mono text-slate-400">Oturum kontrol ediliyor...</div>
    </div>
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

    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error('Supabase session error:', error);
      }

      setUser(data?.session?.user ?? null);
      setLoading(false);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
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
    return <div className="w-full min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar user={user} />
      <div className="flex min-h-screen flex-col md:ml-64">
        <Navbar />
        <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8">{children}</main>
      </div>
    </div>
  );
}
