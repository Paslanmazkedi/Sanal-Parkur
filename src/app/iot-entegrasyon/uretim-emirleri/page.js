'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { W3StageBadge } from '@/components/w3/W3LiveToolbar';
import { readStoredCompanyId, writeStoredCompanyId } from '@/components/w3/W3CompanySelector';
import { STAGE_META } from '@/lib/stationStages';
import { supabase } from '../../supabase';

const FILTER_CONTROL =
  'h-9 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-sm text-white outline-none transition focus:border-emerald-500';

const DATE_CONTROL = `${FILTER_CONTROL} date-input-dark w-full sm:w-[9.5rem]`;

const STAGE_OPTIONS = [
  { value: 'all', label: 'Tüm statüler' },
  ...Object.entries(STAGE_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

/** HTML date (YYYY-MM-DD) → WEX (DD/MM/YYYY) */
function toWexDate(isoDate) {
  if (!isoDate) return undefined;
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return undefined;
  return `${day}/${month}/${year}`;
}

/** WEX (DD/MM/YYYY) → HTML date (YYYY-MM-DD) */
function fromWexDate(wexDate) {
  if (!wexDate || typeof wexDate !== 'string') return '';
  const match = wexDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function stationKey(row) {
  if (row.STATION_ID != null && row.STATION_ID !== '') return String(row.STATION_ID);
  return row.STATION_NAME ? `name:${row.STATION_NAME}` : '';
}

function toQty(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatQty(value) {
  const n = toQty(value);
  if (n == null) return '—';
  return n.toLocaleString('tr-TR');
}

function orderQty(row) {
  const target = toQty(row.QUANTITY);
  const produced = toQty(row.PRODUCED_QTY) ?? 0;
  const remaining = target == null ? null : Math.max(0, target - produced);
  const percent = target && target > 0 ? Math.min(999, Math.round((produced / target) * 1000) / 10) : null;
  return { target, produced, remaining, percent };
}

async function attachLocalCounters(wexRows) {
  if (!wexRows.length) return wexRows;

  const { data, error } = await supabase
    .from('production_orders')
    .select('p_order_id,p_order_no,quantity,counter_value');

  if (error || !data?.length) {
    return wexRows.map((row) => ({
      ...row,
      PRODUCED_QTY: toQty(row.RESULT_AMOUNT ?? row.COUNTER_VALUE) ?? 0,
    }));
  }

  const byId = new Map(data.map((item) => [Number(item.p_order_id), item]));
  const byNo = new Map(
    data
      .filter((item) => item.p_order_no)
      .map((item) => [String(item.p_order_no).trim().toLowerCase(), item]),
  );

  return wexRows.map((row) => {
    const local =
      byId.get(Number(row.P_ORDER_ID)) ||
      byNo.get(String(row.P_ORDER_NO || '').trim().toLowerCase()) ||
      null;
    const produced =
      toQty(row.RESULT_AMOUNT) ??
      toQty(row.COUNTER_VALUE) ??
      toQty(local?.counter_value) ??
      0;
    const quantity = toQty(row.QUANTITY) ?? toQty(local?.quantity);

    return {
      ...row,
      QUANTITY: quantity ?? row.QUANTITY,
      PRODUCED_QTY: produced,
    };
  });
}

function RefreshIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

export default function W3ProductionOrdersPage() {
  const [companyId, setCompanyId] = useState(1);
  const [companyOptions, setCompanyOptions] = useState([{ id: 1, label: 'Şirket 1' }]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [draftSearch, setDraftSearch] = useState('');
  const [draftStatus, setDraftStatus] = useState('all');
  const [draftStation, setDraftStation] = useState('all');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const [appliedStation, setAppliedStation] = useState('all');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const loadOrders = useCallback(async (nextCompanyId, range = {}, { seedDates = false } = {}) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ company_id: String(nextCompanyId) });
      const startDate = toWexDate(range.dateFrom);
      const finishDate = toWexDate(range.dateTo);
      if (startDate) params.set('start_date', startDate);
      if (finishDate) params.set('finish_date', finishDate);

      const response = await fetch(`/api/w3/production-orders?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Workcube WEX uretim emirleri alinamadi.');
      }

      setRows(await attachLocalCounters(payload.rows || []));
      setFetchedAt(payload.fetchedAt || '');

      if (seedDates && payload.dateRange) {
        const from = fromWexDate(payload.dateRange.startDate);
        const to = fromWexDate(payload.dateRange.finishDate);
        if (from) {
          setDraftDateFrom(from);
          setAppliedDateFrom(from);
        }
        if (to) {
          setDraftDateTo(to);
          setAppliedDateTo(to);
        }
      }

      if (payload.companyOptions?.length) {
        setCompanyOptions(payload.companyOptions);
      }
    } catch (err) {
      setError(err.message || 'Beklenmeyen hata');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedCompanyId = readStoredCompanyId(1);
    setCompanyId(storedCompanyId);
    loadOrders(storedCompanyId, {}, { seedDates: true });
  }, [loadOrders]);

  const handleCompanyChange = (nextCompanyId) => {
    setCompanyId(nextCompanyId);
    writeStoredCompanyId(nextCompanyId);
    loadOrders(nextCompanyId, { dateFrom: appliedDateFrom, dateTo: appliedDateTo });
  };

  const applyFilters = () => {
    setAppliedSearch(draftSearch);
    setAppliedStatus(draftStatus);
    setAppliedStation(draftStation);
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
    loadOrders(companyId, { dateFrom: draftDateFrom, dateTo: draftDateTo });
  };

  const stationOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = stationKey(row);
      if (!key || map.has(key)) return;
      map.set(key, row.STATION_NAME || `İstasyon #${row.STATION_ID}`);
    });
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  }, [rows]);

  useEffect(() => {
    if (appliedStation === 'all') return;
    if (!stationOptions.some((option) => option.value === appliedStation)) {
      setAppliedStation('all');
      setDraftStation('all');
    }
  }, [stationOptions, appliedStation]);

  const filteredRows = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [row.P_ORDER_NO, row.PRODUCT_NAME, row.LOT_NO, row.STATION_NAME, row.PRODUCTION_STAGE_STATUS]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        appliedStatus === 'all' || Number(row.PRODUCTION_STAGE) === Number(appliedStatus);

      const matchesStation = appliedStation === 'all' || stationKey(row) === appliedStation;

      return matchesSearch && matchesStatus && matchesStation;
    });
  }, [rows, appliedSearch, appliedStatus, appliedStation]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedSearch.trim()) count += 1;
    if (appliedStatus !== 'all') count += 1;
    if (appliedStation !== 'all') count += 1;
    if (appliedDateFrom) count += 1;
    if (appliedDateTo) count += 1;
    return count;
  }, [appliedSearch, appliedStatus, appliedStation, appliedDateFrom, appliedDateTo]);

  const filterFields = (
    <>
      <label className="flex min-w-0 flex-[2] flex-col gap-1 lg:min-w-[18rem] lg:max-w-[28rem]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ara</span>
        <input
          type="search"
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') applyFilters();
          }}
          placeholder="Emir, ürün, lot..."
          className={`${FILTER_CONTROL} w-full`}
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1 sm:min-w-[9.5rem]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Statü</span>
        <select
          value={draftStatus}
          onChange={(event) => setDraftStatus(event.target.value)}
          className={`${FILTER_CONTROL} w-full sm:min-w-[9.5rem]`}
        >
          {STAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-col gap-1 sm:min-w-[11rem] lg:flex-1 lg:max-w-[14rem]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">İstasyon</span>
        <select
          value={draftStation}
          onChange={(event) => setDraftStation(event.target.value)}
          className={`${FILTER_CONTROL} w-full`}
        >
          <option value="all">Tüm istasyonlar</option>
          {stationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Başlangıç</span>
        <input
          type="date"
          value={draftDateFrom}
          onChange={(event) => setDraftDateFrom(event.target.value)}
          className={DATE_CONTROL}
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bitiş</span>
        <input
          type="date"
          value={draftDateTo}
          onChange={(event) => setDraftDateTo(event.target.value)}
          className={DATE_CONTROL}
        />
      </label>
    </>
  );

  const applyButton = (
    <button
      type="button"
      onClick={applyFilters}
      disabled={loading}
      className="h-9 rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Ara
    </button>
  );

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <PageHeader
        title="Üretim Emirleri"
        titleClassName="text-emerald-100"
        crumbs={[
          { label: 'Üretim', href: '/station' },
          { label: 'Üretim Emirleri' },
        ]}
        description={
          <>
            <span className="tabular-nums text-slate-300">{filteredRows.length}</span>
            <span className="text-slate-600"> kayıt</span>
            {fetchedAt ? (
              <>
                <span className="mx-1.5 text-slate-700">·</span>
                <span className="text-slate-500">Son çekim </span>
                <span className="font-mono tabular-nums text-slate-400">
                  {new Date(fetchedAt).toLocaleString('tr-TR')}
                </span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <select
              value={companyId}
              disabled={loading}
              onChange={(event) => handleCompanyChange(Number(event.target.value))}
              aria-label="Şirket"
              className={`${FILTER_CONTROL} w-[7.5rem] sm:min-w-[8.5rem] sm:w-auto`}
            >
              {companyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadOrders(companyId, { dateFrom: appliedDateFrom, dateTo: appliedDateTo })}
              disabled={loading}
              title="Workcube’dan yenile"
              aria-label="Workcube’dan yenile"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/35 bg-gradient-to-br from-amber-500/15 to-emerald-500/15 text-amber-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </>
        }
      />

      {/* Mobil / tablet: açılır filtreleme seçenekleri */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 lg:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Filtreleme Seçenekleri
            </span>
            {activeFilterCount > 0 ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                {activeFilterCount}
              </span>
            ) : null}
          </div>
          <span className={`text-slate-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} aria-hidden>
            ▾
          </span>
        </button>

        {filtersOpen ? (
          <div className="border-t border-slate-800 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">{filterFields}</div>
            <div className="mt-3 flex justify-end">{applyButton}</div>
          </div>
        ) : null}
      </div>

      {/* Masaüstü */}
      <div className="hidden rounded-xl border border-slate-800 bg-slate-900/40 p-3 lg:block">
        <div className="flex flex-row flex-wrap items-end gap-2">{filterFields}</div>
        <div className="mt-3 flex justify-end">{applyButton}</div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="min-w-[64rem] w-full text-sm">
          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Emir No</th>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Lot</th>
              <th className="px-4 py-3 font-medium">İstasyon</th>
              <th className="px-4 py-3 text-right font-medium">Miktar</th>
              <th className="px-4 py-3 text-right font-medium">Üretilen</th>
              <th className="px-4 py-3 text-right font-medium">Kalan</th>
              <th className="px-4 py-3 font-medium">İlerleme</th>
              <th className="px-4 py-3 font-medium">Aşama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  Workcube&apos;dan veri cekiliyor...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  Kayit bulunamadi.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const qty = orderQty(row);
                return (
                  <tr key={row.P_ORDER_ID} className="bg-slate-900/30 hover:bg-slate-900/60">
                    <td className="px-4 py-3 font-mono font-semibold text-white">{row.P_ORDER_NO}</td>
                    <td className="px-4 py-3 text-slate-300">{row.PRODUCT_NAME || '—'}</td>
                    <td className="px-4 py-3 font-mono text-emerald-300">{row.LOT_NO || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{row.STATION_NAME || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-300">
                      {formatQty(qty.target)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-300">
                      {formatQty(qty.produced)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-300">
                      {formatQty(qty.remaining)}
                    </td>
                    <td className="px-4 py-3">
                      {qty.percent == null ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <div className="min-w-[5.5rem]">
                          <p className="font-mono text-xs tabular-nums text-slate-200">{qty.percent}%</p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, qty.percent)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <W3StageBadge stage={row.PRODUCTION_STAGE} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
