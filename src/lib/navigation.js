export const SECTION_HREFS = {
  general: '/',
  production: '/station',
  reports: '/oee',
  quality: '/kalite',
  service: '/servis',
};

export const HOME_LABEL = 'Ana Sayfa';

export const PRODUCTION_DEFAULT_HREF = '/station';

export const PRODUCTION_ORDERS_HREF = '/iot-entegrasyon/uretim-emirleri';

export const WEX_LAB_SECTION_LABEL = 'WEX Lab';

export const REPORTS_SECTION_LABEL = 'Raporlar';

export const MOBILE_TABS = [
  { key: 'general', href: SECTION_HREFS.general, label: 'Ana' },
  { key: 'production', href: PRODUCTION_DEFAULT_HREF, label: 'Üretim' },
  { key: 'quality', href: SECTION_HREFS.quality, label: 'Kalite' },
  { key: 'service', href: SECTION_HREFS.service, label: 'Servis' },
  { key: 'reports', href: SECTION_HREFS.reports, label: 'Raporlar' },
];

export const PRODUCTION_LINKS = [
  { href: '/station', label: 'Operatör Paneli' },
  { href: PRODUCTION_ORDERS_HREF, label: 'Üretim Emirleri' },
  { href: '/iot-entegrasyon/istasyonlar', label: 'İstasyonlar' },
];

export const REPORTS_LINKS = [
  { href: '/oee', label: 'OEE' },
  { href: '/duraklamalar', label: 'Duraklamalar' },
];

export const WEX_LAB_LINKS = [
  { href: '/simulator', label: 'PLC Simülatör' },
  { href: '/iot-gateway', label: 'IoT Gateway' },
  { href: '/logs', label: 'Entegrasyon Logları' },
];

/** @deprecated Use WEX_LAB_LINKS */
export const IOT_TOOLS_LINKS = WEX_LAB_LINKS;

export const WEX_LAB_PATHS = WEX_LAB_LINKS.map((item) => item.href);

export const REPORTS_PATHS = REPORTS_LINKS.map((item) => item.href);

/** Eski URL'ler — menü açık kalsın, sayfalar redirect edilir */
export const LEGACY_PRODUCTION_PATHS = [
  '/uretim',
  '/production-orders',
  '/iot-entegrasyon',
  '/iot-entegrasyon/operator-paneli',
  '/iot-entegrasyon/loglar',
  '/assets',
];

export const PRODUCTION_PATHS = [
  ...PRODUCTION_LINKS.map((item) => item.href),
  ...WEX_LAB_PATHS,
  ...LEGACY_PRODUCTION_PATHS,
];

/** @deprecated Birleşik PRODUCTION_LINKS kullanın */
export const W3_LINKS = PRODUCTION_LINKS.filter(
  (link) => link.href.startsWith('/iot-entegrasyon/'),
);

/** @deprecated PRODUCTION_PATHS kullanın */
export const IOT_PATHS = PRODUCTION_PATHS;

/** @deprecated PRODUCTION_ORDERS_HREF kullanın */
export const WORKCUBE_DEFAULT_HREF = PRODUCTION_ORDERS_HREF;

/** @deprecated Kaldırıldı — tek Üretim menüsü */
export const WORKCUBE_SECTION_LABEL = 'Üretim';

export const PAGE_TITLES = {
  '/': HOME_LABEL,
  '/station': 'Operatör Paneli',
  '/iot-entegrasyon/uretim-emirleri': 'Üretim Emirleri',
  '/iot-entegrasyon/istasyonlar': 'İstasyonlar',
  '/oee': 'OEE',
  '/duraklamalar': 'Duraklamalar',
  '/assets': 'İstasyonlar',
  '/logs': 'Entegrasyon Logları',
  '/simulator': 'PLC Simülatör',
  '/iot-gateway': 'IoT Gateway',
  '/uretim': 'Üretim',
  '/production-orders': 'Üretim Emirleri',
  '/iot-entegrasyon': 'Üretim',
  '/iot-entegrasyon/operator-paneli': 'Operatör Paneli',
  '/iot-entegrasyon/loglar': 'Entegrasyon Logları',
  '/kalite': 'Kalite Özeti',
  '/servis': 'Servis Özeti',
  '/lot-records': 'Lot Kayıtları',
  '/login': 'Giriş',
  '/hesabim': 'Hesabım',
};

export const MORE_MENU_SECTIONS = [
  { title: 'Üretim', links: PRODUCTION_LINKS },
  { title: WEX_LAB_SECTION_LABEL, links: WEX_LAB_LINKS },
  { title: REPORTS_SECTION_LABEL, links: REPORTS_LINKS },
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
  if (sectionKey === 'reports') {
    return REPORTS_PATHS.some((href) => isExactOrNestedPath(pathname, href));
  }
  if (sectionKey === 'quality') {
    return pathname === SECTION_HREFS.quality || pathname.startsWith('/kalite/');
  }
  if (sectionKey === 'service') {
    return pathname === SECTION_HREFS.service || pathname.startsWith('/servis/');
  }
  /** @deprecated production ile birleşti */
  if (sectionKey === 'iot') {
    return PRODUCTION_PATHS.some((href) => isExactOrNestedPath(pathname, href));
  }
  return false;
}

export function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const match = Object.entries(PAGE_TITLES).find(([href]) => isExactOrNestedPath(pathname, href));
  return match?.[1] || 'Sanal Parkur';
}
