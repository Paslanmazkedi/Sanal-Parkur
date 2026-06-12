import './globals.css';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar'; // Sidebar bileşeninin yolunu kontrol et, gerekirse güncelle

export const metadata = {
  title: 'Wex Entegrasyon Paneli',
  description: 'Workcube & PLC Simulasyon Kontrol Merkezi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#080c12] text-slate-100 antialiased">
        <AuthGuard>
          <div className="flex min-h-screen">
            
            {/* Sabit Genişlikteki Sidebar (w-64) */}
            <Sidebar />

            {/* Sağ Taraftaki Ana İçerik Alanı */}
            {/* md:pl-64: Masaüstünde içeriği sidebar genişliği kadar sağa öteler ve altında kalmasını engeller */}
            {/* pt-16 md:pt-0: Mobilde yukarıdaki hamburger menü için üstten pay bırakır */}
            <main className="flex-1 min-w-0 md:pl-64 pt-16 md:pt-0">
              <div className="p-4 md:p-8">
                {children}
              </div>
            </main>

          </div>
        </AuthGuard>
      </body>
    </html>
  );
}