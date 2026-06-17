export const SECTION_HREFS = {
  general: '/',
  production: '/uretim',
  quality: '/kalite',
  service: '/servis',
};

export const MOBILE_TABS = [
  { key: 'general', href: SECTION_HREFS.general, label: 'Genel' },
  { key: 'production', href: SECTION_HREFS.production, label: 'Üretim' },
  { key: 'quality', href: SECTION_HREFS.quality, label: 'Kalite' },
  { key: 'service', href: SECTION_HREFS.service, label: 'Servis' },
];

export const PRODUCTION_LINKS = [
  { href: '/uretim', label: 'Üretim Özeti' },
  { href: '/oee', label: 'OEE Monitör' },
  { href: '/station', label: 'Operatör Paneli' },
  { href: '/production-orders', label: 'Üretim Emirleri' },
  { href: '/assets', label: 'İstasyon Konfigürasyonu' },
  { href: '/logs', label: 'Entegrasyon Logları' },
];

export const IOT_LINKS = [
  { href: '/simulator', label: 'PLC Simülatörü' },
  { href: '/iot-gateway', label: 'IoT Gateway' },
  { href: '/lot-records', label: 'Lot Kayıtları' },
];

export const PRODUCTION_PATHS = [
  ...PRODUCTION_LINKS.map((item) => item.href),
  ...IOT_LINKS.map((item) => item.href),
];

export const IOT_PATHS = IOT_LINKS.map((item) => item.href);

export const PAGE_TITLES = {
  '/': 'Genel Özet',
  '/uretim': 'Üretim Özeti',
  '/kalite': 'Kalite Özeti',
  '/servis': 'Servis Özeti',
  '/oee': 'OEE Monitör',
  '/station': 'Operatör Paneli',
  '/production-orders': 'Üretim Emirleri',
  '/assets': 'İstasyon Konfigürasyonu',
  '/logs': 'Entegrasyon Logları',
  '/simulator': 'PLC Simülatörü',
  '/iot-gateway': 'IoT Gateway',
  '/lot-records': 'Lot Kayıtları',
  '/login': 'Giriş',
};

export const MORE_MENU_SECTIONS = [
  { title: 'Üretim', links: PRODUCTION_LINKS },
  { title: 'IoT Entegrasyon', links: IOT_LINKS },
];

export function isExactOrNestedPath(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSectionActive(pathname, sectionKey) {
  if (sectionKey === 'general') return pathname === '/';
  if (sectionKey === 'production') {
    return PRODUCTION_PATHS.some((href) => isExactOrNestedPath(pathname, href));
  }
  if (sectionKey === 'quality') {
    return pathname === '/kalite' || pathname.startsWith('/kalite/');
  }
  if (sectionKey === 'service') {
    return pathname === '/servis' || pathname.startsWith('/servis/');
  }
  return false;
}

export function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const match = Object.entries(PAGE_TITLES).find(([href]) => isExactOrNestedPath(pathname, href));
  return match?.[1] || 'Sanal Parkur';
}
