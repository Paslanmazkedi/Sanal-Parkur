"use client";

import { usePathname } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <div className="w-full min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:ml-64">
        <Navbar />
        <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8">{children}</main>
      </div>
    </div>
  );
}