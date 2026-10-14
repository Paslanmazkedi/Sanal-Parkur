'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';

function elapsedMs(startIso) {
  const start = new Date(startIso).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Date.now() - start);
}

function formatClock(ms) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes} dk ${String(seconds).padStart(2, '0')} sn`;
}

function minutesFromMs(ms) {
  return Math.max(0, Math.round(ms / 60000));
}

function minutesFromRow(row, nowMs) {
  if (row.duration_finish_date) {
    if (Number.isFinite(Number(row.prod_duration))) {
      const stored = Number(row.prod_duration);
      if (stored > 180) return Math.round(stored / 60);
      return stored;
    }
    const start = new Date(row.duration_start_date).getTime();
    const end = new Date(row.duration_finish_date).getTime();
    if (Number.isFinite(start) && Number.isFinite(end)) return minutesFromMs(end - start);
    return 0;
  }
  return minutesFromMs(nowMs - new Date(row.duration_start_date).getTime());
}

export default function PauseReasonModal({
  open,
  onClose,
  order,
  stationId,
  submitting,
  onStartPause,
  onEndPause,
}) {
  const [types, setTypes] = useState([]);
  const [cats, setCats] = useState([]);
  const [pauses, setPauses] = useState([]);
  const [typeId, setTypeId] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const paused = Number(order?.is_stage) === 3;

  useEffect(() => {
    if (!open) return undefined;
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [open]);

  useEffect(() => {
    if (!open || !order) return;
    setTypeId('');
    setDetail('');
    setError('');
    setLoading(true);

    const load = async () => {
      const [typesRes, catsRes, pauseRes] = await Promise.all([
        supabase
          .from('setup_prod_pause_types')
          .select('prod_pause_type_id, prod_pause_type, prod_pause_type_code, prod_pause_cat_id, pause_detail, is_active')
          .order('prod_pause_type', { ascending: true }),
        supabase.from('setup_prod_pause_cat').select('prod_pause_cat_id, prod_pause_cat').order('prod_pause_cat'),
        supabase
          .from('setup_prod_pause')
          .select('prod_pause_id, prod_pause_type_id, prod_duration, duration_start_date, duration_finish_date')
          .eq('p_order_id', order.p_order_id)
          .is('pr_order_id', null)
          .order('duration_start_date', { ascending: false }),
      ]);

      if (typesRes.error) setError(typesRes.error.message);
      else setError('');

      setTypes((typesRes.data || []).filter((row) => row.is_active !== false));
      setCats(catsRes.error ? [] : catsRes.data || []);
      setPauses(pauseRes.error ? [] : pauseRes.data || []);
      setLoading(false);
    };

    load();
  }, [open, order?.p_order_id, paused, stationId]);

  const grouped = useMemo(() => {
    const catName = (id) => cats.find((c) => Number(c.prod_pause_cat_id) === Number(id))?.prod_pause_cat;
    const groups = new Map();
    for (const row of types) {
      const key = row.prod_pause_cat_id != null ? String(row.prod_pause_cat_id) : 'none';
      const label = catName(row.prod_pause_cat_id) || 'Grup yok';
      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key).items.push(row);
    }
    return [...groups.values()];
  }, [types, cats]);

  const categoryTotals = useMemo(() => {
    const totals = new Map();
    for (const row of pauses) {
      const type = types.find((item) => Number(item.prod_pause_type_id) === Number(row.prod_pause_type_id));
      const cat = cats.find((item) => Number(item.prod_pause_cat_id) === Number(type?.prod_pause_cat_id));
      const label = cat?.prod_pause_cat || 'Kategori yok';
      totals.set(label, (totals.get(label) || 0) + minutesFromRow(row, nowMs));
    }
    return [...totals.entries()];
  }, [pauses, types, cats, nowMs]);

  const openPause = pauses.find((row) => !row.duration_finish_date) || null;
  const showTimer = paused || Boolean(openPause);
  const selected = types.find((row) => String(row.prod_pause_type_id) === String(typeId));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (showTimer) return;
    if (!typeId) {
      setError('Duraklama tipi seçin.');
      return;
    }
    onStartPause({
      typeId: Number(typeId),
      detail: detail.trim() || selected?.pause_detail || '',
    });
  };

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Kapat" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 p-5 sm:max-w-md sm:rounded-2xl"
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-amber-400">Duraklat</p>
        <h2 className="mt-1 font-mono text-lg font-bold text-white">{order.p_order_no}</h2>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Yükleniyor...</p>
        ) : (
          <>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Bu turdaki duraklamalar
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Sonuç bağlanmamış kayıtlar</p>
              {categoryTotals.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Bu turda duraklama yok.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {categoryTotals.map(([label, mins]) => (
                    <li key={label} className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-200">{label}</span>
                      <span className="font-mono tabular-nums text-amber-200">{mins} dk</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showTimer ? (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/80">Şu an duruyor</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-100">
                  {openPause ? formatClock(elapsedMs(openPause.duration_start_date)) : '0 dk 00 sn'}
                </p>
              </div>
            ) : types.length === 0 ? (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-3 text-sm text-amber-100">
                Aktif duraklama tipi yok.{' '}
                <Link href="/iot-entegrasyon/duraklama-tanimlari" className="font-semibold underline">
                  Tanımları aç
                </Link>
              </div>
            ) : (
              <>
                <label className="mt-4 block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Tip
                  </span>
                  <select
                    value={typeId}
                    onChange={(event) => {
                      const next = event.target.value;
                      setTypeId(next);
                      const row = types.find((item) => String(item.prod_pause_type_id) === next);
                      if (row?.pause_detail && !detail) setDetail(row.pause_detail);
                    }}
                    className="min-h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">Seçin</option>
                    {grouped.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map((row) => (
                          <option key={row.prod_pause_type_id} value={String(row.prod_pause_type_id)}>
                            {row.prod_pause_type_code ? `${row.prod_pause_type_code} · ` : ''}
                            {row.prod_pause_type}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="mt-3 block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Not</span>
                  <textarea
                    value={detail}
                    onChange={(event) => setDetail(event.target.value)}
                    maxLength={250}
                    rows={2}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    placeholder="Opsiyonel"
                  />
                </label>
              </>
            )}
          </>
        )}

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm text-slate-300"
          >
            Kapat
          </button>
          {showTimer ? (
            <button
              type="button"
              disabled={submitting}
              onClick={onEndPause}
              className="min-h-11 rounded-lg bg-amber-500 px-4 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              {submitting ? 'Kaydediliyor...' : 'Duraklamayı bitir'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || types.length === 0}
              className="min-h-11 rounded-lg bg-amber-500 px-4 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              {submitting ? 'Kaydediliyor...' : 'Duraklat'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
