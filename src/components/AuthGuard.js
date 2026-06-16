'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

/**
 * @deprecated Oturum kontrolu LayoutWrapper uzerinden yapilir.
 * Geriye donuk importlar icin tutuluyor.
 */
export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setUser(data?.session?.user ?? null);
      setLoading(false);
    };

    checkSession();

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
    if (!user && !isLoginPage) router.replace('/login');
    if (user && isLoginPage) router.replace('/');
  }, [isLoginPage, loading, router, user]);

  if (loading || (!user && !isLoginPage) || (user && isLoginPage)) {
    return (
      <div className="grid min-h-screen w-full place-items-center bg-slate-950 text-slate-100">
        <div className="text-sm font-mono text-slate-400">Oturum kontrol ediliyor...</div>
      </div>
    );
  }

  return children;
}
