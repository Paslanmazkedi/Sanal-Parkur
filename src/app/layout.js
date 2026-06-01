import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Wex Entegrasyon Paneli',
  description: 'Workcube & PLC Simülasyon Kontrol Merkezi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex bg-slate-950 text-slate-100">
        
        {/* SOL NAVİGASYON - Keskin Siyah ve Canlı Kontrast */}
        <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 shrink-0 shadow-2xl">
          <div>
            <div className="mb-8 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <h1 className="text-2xl font-black tracking-wider text-white">
                  WEX <span className="text-emerald-400">LAB</span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1.5 uppercase tracking-widest font-bold">Entegrasyon Kontrol Odası</p>
            </div>
            
            <nav className="space-y-2">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-100 bg-slate-950 hover:bg-slate-800 hover:text-emerald-400 transition-all border border-slate-800">
                <span>🏠</span> <span>Dashboard</span>
              </Link>
              <Link href="/assets" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-100 bg-slate-950 hover:bg-slate-800 hover:text-purple-400 transition-all border border-slate-800">
                <span>🤖</span> <span>İstasyon Konfigürasyonu</span>
              </Link>
              <Link href="/production-orders" className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-100 bg-slate-950 hover:bg-slate-800 hover:text-sky-400 transition-all border border-slate-800">
                <span>📝</span> <span>Workcube İş Emirleri</span>
              </Link>
              <div className="pt-4 my-4 border-t border-slate-800"></div>
              <Link href="/simulator" className="flex items-center gap-3 px-4 py-3.5 text-sm font-black rounded-xl text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20">
                <span>🎛️</span> <span>PLC Sinyal Simülatörü</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800 pt-4 text-slate-400">
            <span>Sanal Parkur v2.0</span>
            <span className="text-emerald-400 font-bold">● ONLINE</span>
          </div>
        </aside>

        {/* SAĞ PANEL ALANI */}
        <main className="flex-1 p-10 bg-slate-950 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}