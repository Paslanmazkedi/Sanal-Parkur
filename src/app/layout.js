import './globals.css';
import AuthGuard from '../components/AuthGuard';
import { AuthProvider } from '../hooks/useAuth';
import LayoutWrapper from './components/LayoutWrapper';

export const metadata = {
  title: 'Wex Entegrasyon Paneli',
  description: 'Workcube & PLC Simulasyon Kontrol Merkezi',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <AuthProvider>
          <AuthGuard>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
