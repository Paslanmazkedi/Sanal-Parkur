'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';


export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, assets: 0, operations: 0 });
  const [recentOps, setRecentOps] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const { count: oCount } = await supabase.from('production_orders').select('*', { count: 'exact', head: true });
      const { count: aCount } = await supabase.from('assets').select('*', { count: 'exact', head: true });
      const { data: ops, count: opCount } = await supabase.from('production_order_operations').select('*', { count: 'exact' }).order('id', { ascending: false }).limit(5);

      setStats({ orders: oCount || 0, assets: aCount || 0, operations: opCount || 0 });
      if (ops) setRecentOps(ops);
    };
    loadDashboardData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-white">Entegrasyon Kontrol Paneli</h1>
        <p className="text-slate-400 text-sm mt-2">WEX katmanı ile akıllı fabrikadan gelen eşzamanlı verilerin yönetim konsolu.</p>
      </header>

      {/* SAYAÇ KARTLARI (Cam Efektli & Hover Glow) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:border-sky-500/20 transition-all duration-300 group">
          <div className="text-xs font-mono text-sky-400 uppercase tracking-widest font-semibold">Aktif İş Emirleri</div>
          <div className="text-4xl font-black mt-3 text-white tracking-tight group-hover:translate-x-1 transition-transform duration-200">{stats.orders} <span className="text-sm font-normal text-slate-500">Adet</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:border-purple-500/20 transition-all duration-300 group">
          <div className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold">Kayıtlı İstasyon</div>
          <div className="text-4xl font-black mt-3 text-white tracking-tight group-hover:translate-x-1 transition-transform duration-200">{stats.assets} <span className="text-sm font-normal text-slate-500">Cihaz</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:border-emerald-500/20 transition-all duration-300 group">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">Toplam PLC Sinyali</div>
          <div className="text-4xl font-black mt-3 text-emerald-400 tracking-tight group-hover:translate-x-1 transition-transform duration-200">{stats.operations} <span className="text-sm font-normal text-slate-500 text-slate-400">Kayıt</span></div>
        </div>
      </div>

      {/* CANLI AKIŞ TABLOSU */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-200 font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Canlı WEX Hattı Veri Akışı (Son 5 Kayıt)
          </h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-black/20">
          <table className="w-full text-left text-xs text-slate-400 border-collapse">
            <thead className="bg-slate-900/80 text-slate-300 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Sinyal ID</th>
                <th className="p-4">İş Emri ID</th>
                <th className="p-4">İstasyon ID</th>
                <th className="p-4">Sinyal Tipi</th>
                <th className="p-4">Sayaç / Metraj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {recentOps.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                    Sistemde henüz kayıtlı sinyal yok. Simülatörden veri ateşleyin!
                  </td>
                </tr>
              )}
              {recentOps.map(op => (
                <tr key={op.id} className="hover:bg-slate-900/40 transition-colors duration-150">
                  <td className="p-4 font-mono font-bold text-slate-400">#{op.id}</td>
                  <td className="p-4 font-medium text-slate-300">Emir #{op.p_order_id}</td>
                  <td className="p-4 text-slate-300">Cihaz #{op.asset_id}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      op.type === 1 ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {op.type === 1 ? 'Giriş / Başlangıç' : 'Çıkış / Sonuç'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-white text-sm font-semibold">{op.start_counter} m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}