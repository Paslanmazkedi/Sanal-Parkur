export default function manifest() {
  return {
    name: 'Sanal Parkur',
    short_name: 'Sanal Parkur',
    description: 'Üretim, kalite ve servis genel bakış paneli',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    lang: 'tr',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Operatör Paneli',
        short_name: 'Operatör',
        description: 'Tam ekran saha operatör paneli',
        url: '/station?kiosk=1',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
