'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

const PUBLIC_PATHS = ['/login'];

function AuthLoading() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 grid place-items-center">
      <div className="text-sm font-mono text-slate-400">Oturum kontrol ediliyor...</div>
    </div>
  );
}

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [isPublicRoute, loading, pathname, router, user]);

  if (loading) {
    return <AuthLoading />;
  }

  if (!user && !isPublicRoute) {
    return <AuthLoading />;
  }

  if (user && pathname === '/login') {
    return <AuthLoading />;
  }

  return children;
}
