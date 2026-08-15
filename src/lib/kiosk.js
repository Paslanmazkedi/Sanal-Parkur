export const KIOSK_STORAGE_KEY = 'operator_kiosk_mode';

export const OPERATOR_KIOSK_PATH = '/station';

export function isStationRoute(pathname) {
  return pathname === OPERATOR_KIOSK_PATH || pathname.startsWith(`${OPERATOR_KIOSK_PATH}/`);
}

export function parseKioskQuery(searchParams) {
  const param = searchParams?.get?.('kiosk');
  if (param === '1' || param === 'true') return true;
  if (param === '0' || param === 'false') return false;
  return null;
}

/** URL ?kiosk=1 kalıcı açar; ?kiosk=0 kapatır; yoksa localStorage'a bakar. */
export function resolveKioskEnabled(pathname, searchParams) {
  if (!isStationRoute(pathname)) return false;

  const fromQuery = parseKioskQuery(searchParams);
  if (fromQuery === true) {
    if (typeof window !== 'undefined') window.localStorage.setItem(KIOSK_STORAGE_KEY, '1');
    return true;
  }
  if (fromQuery === false) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KIOSK_STORAGE_KEY);
    return false;
  }

  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(KIOSK_STORAGE_KEY) === '1';
}

export function buildOperatorKioskUrl(stationId) {
  const params = new URLSearchParams({ kiosk: '1' });
  if (stationId) params.set('station', String(stationId));
  return `${OPERATOR_KIOSK_PATH}?${params.toString()}`;
}
