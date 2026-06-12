import './globals.css';
import LayoutWrapper from './components/LayoutWrapper';

export const metadata = {
  title: 'Wex Entegrasyon Paneli',
  description: 'Workcube & PLC Simulasyon Kontrol Merkezi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-gray-50">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}