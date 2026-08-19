'use client';

import { useCallback, useEffect, useState } from 'react';
import AddStationModal from '@/components/station/AddStationModal';
import PageHeader from '@/components/PageHeader';
import W3LiveToolbar from '@/components/w3/W3LiveToolbar';
import { readStoredCompanyId, writeStoredCompanyId } from '@/components/w3/W3CompanySelector';
import { supabase } from '../../supabase';

export default function W3StationsPage() {
  const [companyId, setCompanyId] = useState(1);
  const [companyOptions, setCompanyOptions] = useState([{ id: 1, label: 'Şirket 1' }]);
  const [rows, setRows] = useState([]);
  const [localStations, setLocalStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const loadLocalStations = useCallback(async () => {
    setLocalLoading(true);
    const { data, error: localError } = await supabase
      .from('workstations')
      .select('station_id,station_name,branch,department,active')
      .order('station_id', { ascending: true });

    if (!localError) setLocalStations(data || []);
    setLocalLoading(false);
  }, []);

  const loadStations = useCallback(async (nextCompanyId) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/w3/workstations?company_id=${nextCompanyId}`, {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Workcube WEX istasyon verisi alinamadi.');
      }

      setRows(payload.rows || []);
      setFetchedAt(payload.fetchedAt || '');

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
    loadStations(storedCompanyId);
    loadLocalStations();
  }, [loadStations, loadLocalStations]);

  const handleCompanyChange = (nextCompanyId) => {
    setCompanyId(nextCompanyId);
    writeStoredCompanyId(nextCompanyId);
    loadStations(nextCompanyId);
  };

  const filteredRows = rows.filter((row) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [row.STATION_NAME, row.BRANCH_NAME, row.DEPARTMENT_HEAD, row.STATUS]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && Number(row.ACTIVE) === 1) ||
      (statusFilter === 'inactive' && Number(row.ACTIVE) !== 1);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        title="İstasyonlar"
        titleClassName="text-emerald-100"
        crumbs={[
          { label: 'Üretim', href: '/station' },
          { label: 'İstasyonlar' },
        ]}
        description="Saha kayıtları ve Workcube istasyon listesi."
        actions={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white transition hover:bg-emerald-500"
            title="Yeni istasyon ekle"
            aria-label="Yeni istasyon ekle"
          >
            +
          </button>
        }
      />

      <section className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Saha istasyonları ({localStations.length})</h2>
        </div>
        <table className="min-w-[40rem] w-full text-sm">
          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">İstasyon</th>
              <th className="px-4 py-3 font-medium">Şube</th>
              <th className="px-4 py-3 font-medium">Departman</th>
              <th className="px-4 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {localLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : localStations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Saha kaydı yok. + ile yeni istasyon ekleyin.
                </td>
              </tr>
            ) : (
              localStations.map((st) => (
                <tr key={st.station_id} className="bg-slate-900/30">
                  <td className="px-4 py-3 font-mono text-slate-400">#{st.station_id}</td>
                  <td className="px-4 py-3 font-medium text-white">{st.station_name}</td>
                  <td className="px-4 py-3 text-slate-300">{st.branch || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{st.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${
                        st.active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                      }`}
                    >
                      {st.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <W3LiveToolbar
        companyId={companyId}
        companyOptions={companyOptions}
        onCompanyChange={handleCompanyChange}
        onRefresh={() => loadStations(companyId)}
        loading={loading}
        fetchedAt={fetchedAt}
        count={filteredRows.length}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Istasyon, sube veya departman ara..."
          className="w-full flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-12 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none transition focus:border-emerald-500 sm:min-w-[10rem]"
        >
          <option value="all">Tum durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Workcube listesi</h2>
        </div>
        <table className="min-w-[48rem] w-full text-sm">
          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Istasyon</th>
              <th className="px-4 py-3 font-medium">Sube</th>
              <th className="px-4 py-3 font-medium">Departman</th>
              <th className="px-4 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Workcube&apos;dan veri cekiliyor...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Kayit bulunamadi.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.STATION_ID} className="bg-slate-900/30 hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-mono text-slate-400">#{row.STATION_ID}</td>
                  <td className="px-4 py-3 font-medium text-white">{row.STATION_NAME}</td>
                  <td className="px-4 py-3 text-slate-300">{row.BRANCH_NAME || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{row.DEPARTMENT_HEAD || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${
                        Number(row.ACTIVE) === 1
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                      }`}
                    >
                      {row.STATUS || (Number(row.ACTIVE) === 1 ? 'Active' : 'Inactive')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddStationModal open={showModal} onClose={() => setShowModal(false)} onCreated={loadLocalStations} />
    </div>
  );
}
