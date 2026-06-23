import {
  getDefaultCompanyId,
  getOrdersDateRange,
  getPeriodYear,
  getWexSpInfoBaseUrl,
  parseCompanyId,
} from './wexConfig';
import { wexFetch } from './wexFetch';

function buildQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function normalizeWexCollection(payload, idKey) {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload.filter(Boolean);
  }

  if (typeof payload !== 'object') {
    return [];
  }

  return Object.values(payload).filter((item) => item && typeof item === 'object');
}

export async function fetchWexWorkstations(companyIdInput) {
  const companyId = parseCompanyId(companyIdInput, getDefaultCompanyId());
  const baseUrl = getWexSpInfoBaseUrl();
  const query = buildQuery({ company_id: companyId });
  const url = `${baseUrl}/GetWorkstations?${query}`;

  const response = await wexFetch(url);

  const rawText = await response.text();
  let payload;

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Workcube WEX istasyon yaniti JSON degil: ${rawText.slice(0, 180)}`);
  }

  if (!response.ok) {
    throw new Error(`Workcube WEX istasyon istegi basarisiz (${response.status})`);
  }

  const rows = normalizeWexCollection(payload, 'STATION_ID').sort(
    (a, b) => Number(a.STATION_ID) - Number(b.STATION_ID),
  );

  return {
    companyId,
    fetchedAt: new Date().toISOString(),
    sourceUrl: url,
    count: rows.length,
    rows,
  };
}

export async function fetchWexProductionOrders(companyIdInput) {
  const companyId = parseCompanyId(companyIdInput, getDefaultCompanyId());
  const { startDate, finishDate } = getOrdersDateRange();
  const periodYear = getPeriodYear();
  const baseUrl = getWexSpInfoBaseUrl();
  const query = buildQuery({
    start_date: startDate,
    finish_date: finishDate,
    company_id: companyId,
    period_year: periodYear,
  });
  const url = `${baseUrl}/GetProductionOrders?${query}`;

  const response = await wexFetch(url);

  const rawText = await response.text();
  let payload;

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Workcube WEX emir yaniti JSON degil: ${rawText.slice(0, 180)}`);
  }

  if (!response.ok) {
    throw new Error(`Workcube WEX emir istegi basarisiz (${response.status})`);
  }

  const rows = normalizeWexCollection(payload, 'P_ORDER_ID').sort(
    (a, b) => Number(b.P_ORDER_ID) - Number(a.P_ORDER_ID),
  );

  return {
    companyId,
    fetchedAt: new Date().toISOString(),
    sourceUrl: url,
    periodYear,
    dateRange: { startDate, finishDate },
    count: rows.length,
    rows,
  };
}
