'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Sidebar from './Sidebar';

export default function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error('Supabase session error:', error);
      }

      setUser(data?.session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    }

    if (user && isLoginPage) {
      router.replace('/');
    }
  }, [isLoginPage, loading, router, user]);

  if (loading || (!user && !isLoginPage) || (user && isLoginPage)) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 grid place-items-center">
        <div className="text-sm font-mono text-slate-400">Oturum kontrol ediliyor...</div>
      </div>
    );
  }

  if (isLoginPage) {
    return children;
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar user={user} />

      <main className="flex-1 p-10 bg-slate-950 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
