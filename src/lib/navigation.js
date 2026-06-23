export const SECTION_HREFS = {
  general: '/',
  production: '/uretim',
  iot: '/iot-entegrasyon',
  quality: '/kalite',
  service: '/servis',
};

export const WORKCUBE_SECTION_LABEL = 'Workcube Üretim';

export const WORKCUBE_DEFAULT_HREF = '/iot-entegrasyon/uretim-emirleri';

export const MOBILE_TABS = [
  { key: 'general', href: SECTION_HREFS.general, label: 'Genel' },
  { key: 'production', href: SECTION_HREFS.production, label: 'Üretim' },
  { key: 'iot', href: WORKCUBE_DEFAULT_HREF, label: 'Workcube' },
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

export const W3_LINKS = [
  { href: '/iot-entegrasyon/uretim-emirleri', label: 'Üretim' },
  { href: '/iot-entegrasyon/istasyonlar', label: 'W3 İstasyonlar' },
  { href: '/iot-entegrasyon/operator-paneli', label: 'W3 Operatör Paneli' },
  { href: '/iot-entegrasyon/loglar', label: 'W3 Log Kayıtları' },
];

export const IOT_TOOLS_LINKS = [
  { href: '/simulator', label: 'PLC Simülatörü' },
  { href: '/iot-gateway', label: 'IoT Gateway' },
  { href: '/lot-records', label: 'Lot Kayıtları' },
];

export const IOT_LINKS = [...W3_LINKS, ...IOT_TOOLS_LINKS];

export const PRODUCTION_PATHS = PRODUCTION_LINKS.map((item) => item.href);

export const IOT_PATHS = [
  SECTION_HREFS.iot,
  ...W3_LINKS.map((item) => item.href),
  ...IOT_TOOLS_LINKS.map((item) => item.href),
];

export const PAGE_TITLES = {
  '/': 'Genel Özet',
  '/uretim': 'Üretim Özeti',
  '/iot-entegrasyon': 'IoT Entegrasyon Özeti',
  '/kalite': 'Kalite Özeti',
  '/servis': 'Servis Özeti',
  '/oee': 'OEE Monitör',
  '/station': 'Operatör Paneli',
  '/production-orders': 'Üretim Emirleri',
  '/assets': 'İstasyon Konfigürasyonu',
  '/logs': 'Entegrasyon Logları',
  '/iot-entegrasyon/uretim-emirleri': 'Üretim',
  '/iot-entegrasyon/istasyonlar': 'W3 İstasyonlar',
  '/iot-entegrasyon/operator-paneli': 'W3 Operatör Paneli',
  '/iot-entegrasyon/loglar': 'W3 Log Kayıtları',
  '/simulator': 'PLC Simülatörü',
  '/iot-gateway': 'IoT Gateway',
  '/lot-records': 'Lot Kayıtları',
  '/login': 'Giriş',
};

export const MORE_MENU_SECTIONS = [
  { title: 'Üretim', links: PRODUCTION_LINKS },
  { title: WORKCUBE_SECTION_LABEL, links: W3_LINKS },
  { title: 'IoT Araçları', links: IOT_TOOLS_LINKS },
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
  if (sectionKey === 'iot') {
    return IOT_PATHS.some((href) => isExactOrNestedPath(pathname, href));
  }
  if (sectionKey === 'quality') {
    return pathname === SECTION_HREFS.quality || pathname.startsWith('/kalite/');
  }
  if (sectionKey === 'service') {
    return pathname === SECTION_HREFS.service || pathname.startsWith('/servis/');
  }
  return false;
}

export function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const match = Object.entries(PAGE_TITLES).find(([href]) => isExactOrNestedPath(pathname, href));
  return match?.[1] || 'Sanal Parkur';
}
