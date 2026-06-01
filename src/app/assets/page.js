'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';


export default function AssetsPage() {
  const [assetName, setAssetName] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadAssets(); }, []);

    const loadAssets = async () => {
      const { data } = await supabase.from('workstations').select('*').order('id', { ascending: false });
    if (data) setAssets(data);
  };

    const handleCreateAsset = async (e) => {
    e.preventDefault();
    setLoading(true);
      const { error } = await supabase.from('workstations').insert([{ station_name: assetName, status: true }]);
    if (!error) {
      setAssetName('');
      loadAssets();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">İstasyon & Makine Konfigürasyonu</h1>
        <p className="text-slate-400 text-sm mt-1">Saha PLC donanımlarının bağlı olduğu istasyon şeması.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Alanı */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-xl h-fit backdrop-blur-sm">
          <h2 className="text-sm font-bold text-purple-400 mb-4 font-mono uppercase tracking-wider">🛠️ Yeni İstasyon Ekle</h2>
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Örn: Hat-1 Boyama Ünitesi" 
                value={assetName} 
                onChange={(e) => setAssetName(e.target.value)} 
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-slate-600" 
                required 
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-purple-900/20 active:scale-95">
              {loading ? 'Sisteme İşleniyor...' : '+ Parkur Hattına Bağla'}
            </button>
          </form>
        </div>

        {/* Liste Alanı */}
        <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-sm">
          <h2 className="text-sm font-bold text-slate-300 mb-4 font-mono uppercase tracking-wider">📋 Parkurdaki Aktif Makineler ({assets.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assets.map(a => (
              <div key={a.id} className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors">
                 <span className="font-semibold text-slate-200 text-sm">{a.station_name}</span>
                 <span className="bg-purple-950/60 text-purple-400 font-mono text-[11px] font-bold px-2.5 py-1 rounded-md border border-purple-900/40">ID: {a.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}