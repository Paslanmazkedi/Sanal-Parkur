'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function SimulatorPage() {
  const [orders, setOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [orderStationId, setOrderStationId] = useState('');
  const [signalType, setSignalType] = useState(1);
  const [counterValue, setCounterValue] = useState(100.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadSelectionData = async () => {
      const { data: o } = await supabase.from('production_orders').select('*');
        const { data: a } = await supabase.from('workstations').select('*');
      if (o) { setOrders(o); if (o.length > 0) setSelectedOrderId(o[0].p_order_id); }
      if (a) { setAssets(a); if (a.length > 0) setSelectedAssetId(a[0].station_id); }
    };
    loadSelectionData();
  }, []);

  const handleSendSignal = async () => {
    setLoading(true);
    setResult(null);

    const payload = {
      p_order_id: Number(selectedOrderId),
      asset_id: Number(selectedAssetId),
      status_code: signalType === 1 ? 'RUNNING' : signalType === 2 ? 'PAUSED' : 'COMPLETED',
      counter_value: Number(counterValue),
    };

    try {
const response = await fetch('/api/wex', {
        method: 'POST',
headers: {
  'Content-Type': 'application/json',
'x-wex-api-key': '9dd683bc664e5727a20b6f78760bae8652dd3c47e601eaa605d541bc01ef589e',
},
        body: JSON.stringify(payload)
      });
      const resData = await response.json();
      setResult({ success: resData.success, msg: resData.success ? 'Sinyal WEX boru hattından başarıyla aktı, veritabanı güncellendi! 🎉' : `Hata: ${resData.error}` });
    } catch {
      setResult({ success: false, msg: 'Ağ/Bağlantı hatası oluştu.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Delta PLC Donanım Simülatör Laboratuvarı</h1>
        <p className="text-slate-400 text-sm mt-1">Saha cihazından fırlatılacak JSON yüklerini canlı manipüle edin.</p>
      </header>

      {result && (
        <div className={`p-4 rounded-xl border text-sm font-mono font-semibold transition-all ${
          result.success ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/20' : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
        }`}>
          [{result.success ? 'OK' : 'FAIL'}] {result.msg}
        </div>
      )}

      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 shadow-2xl backdrop-blur-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Hedef İş Emri (Workcube)</label>
            <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500">
{orders.map(order => (
  <option key={order.p_order_id} value={order.p_order_id}>
    {order.p_order_no} - {order.product_name2} (ID: {order.p_order_id})
  </option>
))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Sinyalin Tetiklendiği Cihaz</label>
            <select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500" disabled>
{assets.map(a => <option key={a.station_id} value={a.station_id}>{a.station_name} (ID: {a.station_id})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Sinyal Faz Tipi (Type)</label>
            <select value={signalType} onChange={(e) => setSignalType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value={1}>1 - Operasyon / Metraj Başladı</option>
              <option value={2}>2 - Operasyon Tamamlandı (Üretim Sonucu)</option>
              <option value={3}>3 - Duraklama / Alarm Modu</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Anlık PLC Sayaç Değeri</label>
            <input type="number" step="0.1" value={counterValue} onChange={(e) => setCounterValue(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        {/* Kod Terminali Görünümü */}
        <div className="bg-black/40 rounded-xl p-4 border border-slate-800 font-mono text-xs shadow-inner relative overflow-hidden">
          <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50"></div>
          <span className="text-slate-600 block mb-2">// WEX API Kapısına Gidecek Canlı JSON Paketi:</span>
          <pre className="text-emerald-400 font-medium">{JSON.stringify({ p_order_id: Number(selectedOrderId), type: Number(signalType), start_counter: Number(counterValue), asset_id: Number(selectedAssetId) }, null, 2)}</pre>
        </div>

        <button onClick={handleSendSignal} disabled={loading || orders.length === 0 || assets.length === 0} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-black py-3.5 rounded-xl shadow-xl shadow-emerald-950/30 transition-all active:scale-[0.99] tracking-wider uppercase text-sm">
          {loading ? 'Sinyal Paket Hatlarında...' : '🚀 Canlı Donanım Sinyalini Fırlat'}
        </button>
      </div>
    </div>
  );
}