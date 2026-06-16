import './globals.css';
import LayoutWrapper from './components/LayoutWrapper';

export const metadata = {
  title: 'Sanal Parkur — Genel Özet',
  description: 'Üretim, kalite ve servis genel bakış paneli',
  applicationName: 'Sanal Parkur',
  appleWebApp: {
    capable: true,
    title: 'Sanal Parkur',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#0A0A0A',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/app-icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: [{ url: '/icons/icon-192.png', type: 'image/png' }],
  },
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