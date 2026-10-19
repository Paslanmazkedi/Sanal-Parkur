export const SECTION_HREFS = {
  general: '/',
  production: '/station',
  reports: '/oee',
  quality: '/kalite',
  service: '/servis',
};

export const DASHBOARD_TAB_HREFS = {
  production: '/',
  quality: '/?tab=quality',
  maintenance: '/?tab=maintenance',
};

export const DASHBOARD_TAB = {
  production: 'production',
  quality: 'quality',
  maintenance: 'maintenance',
};

export const HOME_LABEL = 'Ana Sayfa';

export const PRODUCTION_DEFAULT_HREF = '/station';

export const PRODUCTION_ORDERS_HREF = '/iot-entegrasyon/uretim-emirleri';

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

export const PARAMETER_SECTION_LABEL = 'Parametreler';

export const PARAMETER_LINKS = [
  { href: '/iot-entegrasyon/duraklama-tanimlari', label: 'Duraklama Tanımları' },
];

export const REPORTS_LINKS = [
  { href: '/oee', label: 'OEE' },
  { href: '/duraklamalar', label: 'Duraklamalar' },
  { href: '/logs', label: 'Entegrasyon Logları' },
];

export const REPORTS_PATHS = REPORTS_LINKS.map((item) => item.href);

/** Eski URL'ler — next.config redirects; menü vurgusu için tutulur */
export const LEGACY_PRODUCTION_PATHS = [
  '/uretim',
  '/production-orders',
  '/iot-entegrasyon',
  '/iot-entegrasyon/operator-paneli',
  '/iot-entegrasyon/loglar',
  '/assets',
  '/simulator',
  '/iot-gateway',
];

export const PARAMETER_PATHS = PARAMETER_LINKS.map((item) => item.href);

export const PRODUCTION_PATHS = [
  ...PRODUCTION_LINKS.map((item) => item.href),
  ...PARAMETER_PATHS,
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
  '/iot-entegrasyon/duraklama-tanimlari': 'Duraklama Tanımları',
  '/oee': 'OEE',
  '/duraklamalar': 'Duraklamalar',
  '/assets': 'İstasyonlar',
  '/logs': 'Entegrasyon Logları',
  '/uretim': 'Üretim',
  '/production-orders': 'Üretim Emirleri',
  '/iot-entegrasyon': 'Üretim',
  '/iot-entegrasyon/operator-paneli': 'Operatör Paneli',
  '/iot-entegrasyon/loglar': 'Entegrasyon Logları',
  '/kalite': 'Kalite',
  '/servis': 'Servis',
  '/lot-records': 'Lot Kayıtları',
  '/login': 'Giriş',
  '/hesabim': 'Hesabım',
};

export const MORE_MENU_SECTIONS = [
  { title: 'Üretim', links: PRODUCTION_LINKS },
  { title: PARAMETER_SECTION_LABEL, links: PARAMETER_LINKS },
  { title: REPORTS_SECTION_LABEL, links: REPORTS_LINKS },
];

export function parseDashboardTab(searchParams) {
  const raw =
    typeof searchParams?.get === 'function'
      ? searchParams.get('tab')
      : searchParams?.tab ?? null;

  if (raw === DASHBOARD_TAB.quality) return DASHBOARD_TAB.quality;
  if (raw === DASHBOARD_TAB.maintenance || raw === 'service' || raw === 'servis') {
    return DASHBOARD_TAB.maintenance;
  }
  return DASHBOARD_TAB.production;
}

export function getDashboardHref(tab) {
  return DASHBOARD_TAB_HREFS[tab] || DASHBOARD_TAB_HREFS.production;
}

export function isExactOrNestedPath(pathname, href) {
  const pathOnly = String(href || '').split('?')[0];
  if (pathOnly === '/') return pathname === '/';
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

export function isSectionActive(pathname, sectionKey, _searchParams) {
  if (sectionKey === 'general') {
    return pathname === '/';
  }
  if (sectionKey === 'production') {
    return PRODUCTION_PATHS.some((href) => isExactOrNestedPath(pathname, href));
  }
  if (sectionKey === 'reports') {
    return REPORTS_PATHS.some((href) => isExactOrNestedPath(pathname, href));
  }
  if (sectionKey === 'quality') {
    return pathname === SECTION_HREFS.quality || pathname.startsWith(`${SECTION_HREFS.quality}/`);
  }
  if (sectionKey === 'service') {
    return pathname === SECTION_HREFS.service || pathname.startsWith(`${SECTION_HREFS.service}/`);
  }
  /** @deprecated production ile birleşti */
  if (sectionKey === 'iot') {
    return PRODUCTION_PATHS.some((href) => isExactOrNestedPath(pathname, href));
  }
  return false;
}

export function isNavHrefActive(pathname, href, searchParams) {
  if (href === SECTION_HREFS.quality) {
    return isSectionActive(pathname, 'quality', searchParams);
  }
  if (href === SECTION_HREFS.service) {
    return isSectionActive(pathname, 'service', searchParams);
  }
  if (href === SECTION_HREFS.general || href === '/') {
    return isSectionActive(pathname, 'general', searchParams);
  }
  return isExactOrNestedPath(pathname, href);
}

export function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const match = Object.entries(PAGE_TITLES).find(([href]) => isExactOrNestedPath(pathname, href));
  return match?.[1] || 'Sanal Parkur';
}
