'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import MobileNav from '../../components/MobileNav';
import { useAuth } from '../../hooks/useAuth';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <div className="w-full min-h-screen min-w-0 overflow-x-hidden">{children}</div>;
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-950">
      <Sidebar user={user} />

      <div className="flex min-h-screen w-full min-w-0 flex-col md:ml-64">
        <Navbar />
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 pb-24 md:p-8 md:pb-8">
          <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
