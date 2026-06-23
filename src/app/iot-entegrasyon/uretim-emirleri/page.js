'use client';

import { useCallback, useEffect, useState } from 'react';
import W3LiveToolbar, { W3StageBadge } from '@/components/w3/W3LiveToolbar';
import { readStoredCompanyId, writeStoredCompanyId } from '@/components/w3/W3CompanySelector';

export default function W3ProductionOrdersPage() {
  const [companyId, setCompanyId] = useState(1);
  const [companyOptions, setCompanyOptions] = useState([{ id: 1, label: 'Şirket 1' }]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState('');
  const [meta, setMeta] = useState('');
  const [search, setSearch] = useState('');

  const loadOrders = useCallback(async (nextCompanyId) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/w3/production-orders?company_id=${nextCompanyId}`, {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Workcube WEX uretim emirleri alinamadi.');
      }

      setRows(payload.rows || []);
      setFetchedAt(payload.fetchedAt || '');
      setMeta(
        payload.dateRange
          ? `Aralik ${payload.dateRange.startDate} - ${payload.dateRange.finishDate} · period_year=${payload.periodYear}`
          : '',
      );

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
    loadOrders(storedCompanyId);
  }, [loadOrders]);

  const handleCompanyChange = (nextCompanyId) => {
    setCompanyId(nextCompanyId);
    writeStoredCompanyId(nextCompanyId);
    loadOrders(nextCompanyId);
  };

  const filteredRows = rows.filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [row.P_ORDER_NO, row.PRODUCT_NAME, row.LOT_NO, row.STATION_NAME, row.PRODUCTION_STAGE_STATUS]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-violet-400">IoT Entegrasyon · Workcube W3</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">W3 Üretim Emirleri</h1>
        <p className="mt-2 text-sm text-slate-400">
          Workcube WEX export servisi uzerinden canli pull. Veri Supabase&apos;e yazilmaz.
        </p>
      </header>

      <W3LiveToolbar
        companyId={companyId}
        companyOptions={companyOptions}
        onCompanyChange={handleCompanyChange}
        onRefresh={() => loadOrders(companyId)}
        loading={loading}
        fetchedAt={fetchedAt}
        count={filteredRows.length}
        meta={meta}
      />

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Emir no, urun, lot veya istasyon ara..."
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
      />

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="min-w-[56rem] w-full text-sm">
          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Emir No</th>
              <th className="px-4 py-3 font-medium">Urun</th>
              <th className="px-4 py-3 font-medium">Lot</th>
              <th className="px-4 py-3 font-medium">Istasyon</th>
              <th className="px-4 py-3 font-medium">Miktar</th>
              <th className="px-4 py-3 font-medium">Asama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Workcube&apos;dan veri cekiliyor...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Kayit bulunamadi.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.P_ORDER_ID} className="bg-slate-900/30 hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-mono font-semibold text-white">{row.P_ORDER_NO}</td>
                  <td className="px-4 py-3 text-slate-300">{row.PRODUCT_NAME || '—'}</td>
                  <td className="px-4 py-3 font-mono text-emerald-300">{row.LOT_NO || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{row.STATION_NAME || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">{row.QUANTITY ?? '—'}</td>
                  <td className="px-4 py-3">
                    <W3StageBadge stage={row.PRODUCTION_STAGE} label={row.PRODUCTION_STAGE_STATUS} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
