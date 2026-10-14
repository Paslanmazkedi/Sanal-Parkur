'use client';

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { supabase } from '../../supabase';

const inputClass =
  'min-h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-500';

function CheckboxRow({ checked, onChange, label }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-slate-600"
      />
      <span>{label}</span>
    </label>
  );
}

function AddModal({ open, title, onClose, onSubmit, submitting, error, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Kapat" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 p-4 sm:max-w-md sm:rounded-2xl sm:p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Workcube ile aynı id ve adları girin. Entegrasyon yok; nadiren değişir.
            </p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 shrink-0 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="space-y-3">{children}</div>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm text-slate-300"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PauseDefinitionsPage() {
  const [cats, setCats] = useState([]);
  const [types, setTypes] = useState([]);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('cat');
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catActive, setCatActive] = useState(true);
  const [catWorking, setCatWorking] = useState(false);

  const [typeId, setTypeId] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeCat, setTypeCat] = useState('');
  const [typeDetail, setTypeDetail] = useState('');
  const [typeActive, setTypeActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [catsRes, typesRes] = await Promise.all([
      supabase.from('setup_prod_pause_cat').select('*').order('prod_pause_cat_id'),
      supabase.from('setup_prod_pause_types').select('*').order('prod_pause_type_id'),
    ]);
    if (catsRes.error) setError(catsRes.error.message);
    else if (typesRes.error) setError(typesRes.error.message);
    else setError('');
    setCats(catsRes.data || []);
    setTypes(typesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCatModal = () => {
    setCatId('');
    setCatName('');
    setCatActive(true);
    setCatWorking(false);
    setFormError('');
    setModal('cat');
  };

  const openTypeModal = () => {
    setTypeId('');
    setTypeName('');
    setTypeCode('');
    setTypeCat(cats[0] ? String(cats[0].prod_pause_cat_id) : '');
    setTypeDetail('');
    setTypeActive(true);
    setFormError('');
    setModal('type');
  };

  const saveCat = async (event) => {
    event.preventDefault();
    if (!catName.trim()) return;
    setSubmitting(true);
    setFormError('');
    const payload = {
      prod_pause_cat: catName.trim(),
      is_active: catActive,
      is_working_time: catWorking,
    };
    const explicitId = Number(catId);
    if (Number.isFinite(explicitId) && explicitId > 0) payload.prod_pause_cat_id = explicitId;

    const { error: insertError } = await supabase.from('setup_prod_pause_cat').insert(payload);
    setSubmitting(false);
    if (insertError) {
      setFormError(insertError.message);
      return;
    }
    setModal(null);
    await load();
  };

  const saveType = async (event) => {
    event.preventDefault();
    if (!typeName.trim()) return;
    setSubmitting(true);
    setFormError('');
    const payload = {
      prod_pause_type: typeName.trim(),
      prod_pause_type_code: typeCode.trim() || null,
      prod_pause_cat_id: typeCat ? Number(typeCat) : null,
      pause_detail: typeDetail.trim() || null,
      is_active: typeActive,
    };
    const explicitId = Number(typeId);
    if (Number.isFinite(explicitId) && explicitId > 0) payload.prod_pause_type_id = explicitId;

    const { error: insertError } = await supabase.from('setup_prod_pause_types').insert(payload);
    setSubmitting(false);
    if (insertError) {
      setFormError(insertError.message);
      return;
    }
    setModal(null);
    await load();
  };

  const catLabel = (id) =>
    cats.find((row) => Number(row.prod_pause_cat_id) === Number(id))?.prod_pause_cat || '—';

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-4 sm:space-y-6">
      <PageHeader
        title="Duraklama Tanımları"
        className="flex-col sm:flex-row"
        crumbs={[
          { label: 'Üretim', href: '/station' },
          { label: 'Parametreler' },
          { label: 'Duraklama Tanımları' },
        ]}
        actions={
          <button
            type="button"
            onClick={tab === 'cat' ? openCatModal : openTypeModal}
            aria-label={tab === 'cat' ? 'Kategori ekle' : 'Tip ekle'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/15 text-lg font-semibold text-violet-200 transition hover:border-violet-400/60 hover:bg-violet-500/25 hover:text-violet-100"
          >
            +
          </button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
        <button
          type="button"
          onClick={() => setTab('cat')}
          className={`min-h-11 flex-1 rounded-lg text-sm font-semibold ${
            tab === 'cat' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Kategori
        </button>
        <button
          type="button"
          onClick={() => setTab('type')}
          className={`min-h-11 flex-1 rounded-lg text-sm font-semibold ${
            tab === 'type' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Tip
        </button>
      </div>

      {tab === 'cat' ? (
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="min-w-[36rem] w-full text-sm">
              <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3 sm:px-4">ID</th>
                  <th className="px-3 py-3 sm:px-4">Ad</th>
                  <th className="px-3 py-3 sm:px-4">Aktif</th>
                  <th className="px-3 py-3 sm:px-4">Çalışma süresine dahil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : cats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      Kategori yok. + Kategori ile ekleyin.
                    </td>
                  </tr>
                ) : (
                  cats.map((row) => (
                    <tr key={row.prod_pause_cat_id}>
                      <td className="px-3 py-3 font-mono sm:px-4">{row.prod_pause_cat_id}</td>
                      <td className="px-3 py-3 sm:px-4">{row.prod_pause_cat}</td>
                      <td className="px-3 py-3 sm:px-4">{row.is_active === false ? 'Hayır' : 'Evet'}</td>
                      <td className="px-3 py-3 sm:px-4">{row.is_working_time ? 'Evet' : 'Hayır'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="min-w-[40rem] w-full text-sm">
              <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3 sm:px-4">ID</th>
                  <th className="px-3 py-3 sm:px-4">Kod</th>
                  <th className="px-3 py-3 sm:px-4">Ad</th>
                  <th className="px-3 py-3 sm:px-4">Kategori</th>
                  <th className="px-3 py-3 sm:px-4">Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : types.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Tip yok. Önce kategori, sonra + Tip.
                    </td>
                  </tr>
                ) : (
                  types.map((row) => (
                    <tr key={row.prod_pause_type_id}>
                      <td className="px-3 py-3 font-mono sm:px-4">{row.prod_pause_type_id}</td>
                      <td className="px-3 py-3 font-mono text-slate-400 sm:px-4">{row.prod_pause_type_code || '—'}</td>
                      <td className="px-3 py-3 sm:px-4">{row.prod_pause_type}</td>
                      <td className="px-3 py-3 sm:px-4">{catLabel(row.prod_pause_cat_id)}</td>
                      <td className="px-3 py-3 sm:px-4">{row.is_active === false ? 'Hayır' : 'Evet'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AddModal
        open={modal === 'cat'}
        title="Kategori ekle"
        onClose={() => setModal(null)}
        onSubmit={saveCat}
        submitting={submitting}
        error={formError}
      >
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase text-slate-500">Workcube ID</span>
          <input value={catId} onChange={(e) => setCatId(e.target.value)} className={inputClass} placeholder="PROD_PAUSE_CAT_ID" inputMode="numeric" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase text-slate-500">Ad</span>
          <input value={catName} onChange={(e) => setCatName(e.target.value)} className={inputClass} required />
        </label>
        <CheckboxRow checked={catActive} onChange={setCatActive} label="Aktif" />
        <CheckboxRow checked={catWorking} onChange={setCatWorking} label="Çalışma süresine dahil" />
      </AddModal>

      <AddModal
        open={modal === 'type'}
        title="Tip ekle"
        onClose={() => setModal(null)}
        onSubmit={saveType}
        submitting={submitting}
        error={formError}
      >
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase text-slate-500">Workcube ID</span>
          <input value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputClass} placeholder="PROD_PAUSE_TYPE_ID" inputMode="numeric" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase text-slate-500">Kod</span>
          <input value={typeCode} onChange={(e) => setTypeCode(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase text-slate-500">Ad</span>
          <input value={typeName} onChange={(e) => setTypeName(e.target.value)} className={inputClass} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase text-slate-500">Kategori</span>
          <select value={typeCat} onChange={(e) => setTypeCat(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {cats.map((row) => (
              <option key={row.prod_pause_cat_id} value={String(row.prod_pause_cat_id)}>
                #{row.prod_pause_cat_id} · {row.prod_pause_cat}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase text-slate-500">Varsayılan not</span>
          <input value={typeDetail} onChange={(e) => setTypeDetail(e.target.value)} className={inputClass} />
        </label>
        <CheckboxRow checked={typeActive} onChange={setTypeActive} label="Aktif" />
      </AddModal>
    </div>
  );
}
