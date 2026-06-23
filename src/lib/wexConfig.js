const DEFAULT_BASE_URL = 'https://test.hzrtelcit.com.tr/wex.cfm/sanal_parkur';

export function getWexSpInfoBaseUrl() {
  return (process.env.WEX_SPINFO_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

export function getDefaultCompanyId() {
  const parsed = Number(process.env.WEX_DEFAULT_COMPANY_ID || 1);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getCompanyOptions() {
  const raw = process.env.WEX_COMPANY_IDS || String(getDefaultCompanyId());
  const ids = raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  const uniqueIds = [...new Set(ids.length ? ids : [getDefaultCompanyId()])];

  return uniqueIds.map((id) => ({
    id,
    label: `Şirket ${id}`,
  }));
}

export function getPeriodYear() {
  const configured = Number(process.env.WEX_PERIOD_YEAR);
  if (Number.isFinite(configured) && configured > 2000) {
    return configured;
  }
  return new Date().getFullYear();
}

export function getOrdersDateRange() {
  return {
    startDate: process.env.WEX_ORDERS_START_DATE || '01/01/2020',
    finishDate: process.env.WEX_ORDERS_FINISH_DATE || '31/12/2030',
  };
}

export function parseCompanyId(value, fallback = getDefaultCompanyId()) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  const allowed = getCompanyOptions().map((item) => item.id);
  if (allowed.length && !allowed.includes(parsed)) {
    return fallback;
  }

  return parsed;
}
