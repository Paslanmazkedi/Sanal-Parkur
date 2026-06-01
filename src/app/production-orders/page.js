'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';


export default function ProductionOrdersPage() {
  const [woCode, setWoCode] = useState('WO-2026-001');
  const [woQty, setWoQty] = useState(100);
  const [orders, setOrders] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
      const { data: o } = await supabase.from('production_orders').select('*').order('id', { ascending: false });
      const { data: w } = await supabase.from('workstations').select('id,station_name').order('id', { ascending: false });
      if (w) setWorkstations(w);
      if (o) {
        setOrders(o);
        if (o.length > 0 && !selectedStationId) setSelectedStationId(o[0].station_id?.toString() || '');
      }
    };

    const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
      const { error } = await supabase.from('production_orders').insert([{ code: woCode, total_qty: woQty, status: 1, station_id: Number(selectedStationId) }]);
    if (!error) {
      setWoCode(`WO-2026-00${orders.length + 2}`);
      loadOrders();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Workcube ERP İş Emirleri</h1>
        <p className="text-slate-400 text-sm mt-1">WEX'in eşleştireceği ana Workcube üretim planlama kodları.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-xl h-fit backdrop-blur-sm">
          <h2 className="text-sm font-bold text-sky-400 mb-4 font-mono uppercase tracking-wider">📦 Yeni İş Emri Fırlat</h2>
          <form onSubmit={handleCreateOrder} className="space-y-4">
             <div>
               <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">İş Emri Kodu</label>
               <input type="text" value={woCode} onChange={(e) => setWoCode(e.target.value)} className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500" required />
             </div>
             <div>
               <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Hedef Üretim (Metraj)</label>
               <input type="number" value={woQty} onChange={(e) => setWoQty(Number(e.target.value))} className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500" required />
             </div>
             <div>
               <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">İstasyon Seçimi</label>
               <select value={selectedStationId} onChange={(e) => setSelectedStationId(e.target.value)} className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500" required>
                 {workstations.map(ws => <option key={ws.id} value={ws.id}>{ws.station_name} (ID: {ws.id})</option>)}
               </select>
             </div>
            <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-sky-900/20 active:scale-95">
              {loading ? 'ERP İletişimi...' : '+ Workcube Havuzuna Gönder'}
            </button>
          </form>
        </div>

             <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-sm">
          <h2 className="text-sm font-bold text-slate-300 mb-4 font-mono uppercase tracking-wider">📋 Aktif Sipariş & Üretim Emirleri</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
             {orders.map(o => (
              <div key={o.id} className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors">
                 <div>
                   <span className="font-bold text-slate-200 text-sm block">{o.code}</span>
                   <span className="text-xs font-mono text-slate-500">Planlanan Hacim: {o.total_qty} m</span>
                 </div>
                 <div>
                   <span className="text-xs font-mono text-slate-500">İstasyon: {workstations.find(ws => ws.id === o.station_id)?.station_name || 'Bilinmiyor'}</span>
                 </div>
                <span className="bg-sky-950/60 text-sky-400 font-mono text-[11px] font-bold px-2.5 py-1 rounded-md border border-sky-900/40">ID: {o.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}