'use client';
import { useState } from 'react';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Butona basıldığında arkadaşının simülatörünün yapacağı POST isteğini taklit eder
  const sendTestData = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/operation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_order_id: 1001,      // İş emri ID (Wex kurgusu)
          type: 1,               // Sinyal tipi (Giriş/Çıkış vb.)
          start_counter: 125.50, // Delta PLC sayacı
          asset_id: 12           // İstasyon / Makine ID
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus({ type: 'success', message: 'Şahane! Veri API kapısından geçti ve Supabase bulutuna yazıldı! 🎉' });
      } else {
        setStatus({ type: 'error', message: `Hata oluştu: ${result.error}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Ağ hatası veya API kapısı kapalı.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 text-center">
        <h1 className="text-2xl font-bold mb-2 text-emerald-400">⚡ Sanal Parkur Kontrol Merkezi</h1>
        <p className="text-slate-400 text-sm mb-6">Delta PLC simülasyon test tünelini yerel/canlı olarak buradan tetikleyebilirsiniz.</p>
        
        <button
          onClick={sendTestData}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
            loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
          }`}
        >
          {loading ? 'Sinyal Gönderiliyor...' : '🚀 Simülasyon Sinyali Gönder (POST)'}
        </button>

        {status && (
          <div className={`mt-6 p-4 rounded-lg text-sm text-left ${
            status.type === 'success' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/50 border border-rose-500/30 text-rose-300'
          }`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}