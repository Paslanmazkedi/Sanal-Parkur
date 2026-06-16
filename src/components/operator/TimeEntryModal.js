'use client';

import { useEffect, useState } from 'react';
import { EMPTY_TIME_LINE } from '@/lib/operatorConstants';
import { postTimeEntry } from '@/lib/operatorApi';

export default function TimeEntryModal({ open, onClose, order, stationId, operators, onSuccess }) {
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ ...EMPTY_TIME_LINE }, { ...EMPTY_TIME_LINE }, { ...EMPTY_TIME_LINE }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setEntryDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setLines([{ ...EMPTY_TIME_LINE }, { ...EMPTY_TIME_LINE }, { ...EMPTY_TIME_LINE }]);
    setError('');
  }, [open, order?.p_order_id]);

  if (!open || !order) return null;

  const updateLine = (index, key, value) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        if (key === 'operator_id') {
          const selected = operators.find((op) => op.id === value);
          return {
            ...line,
            operator_id: value,
            operator_name: selected?.full_name || line.operator_name,
          };
        }
        return { ...line, [key]: value };
      }),
    );
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_TIME_LINE }]);

  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await postTimeEntry({
        pOrderId: order.p_order_id,
        stationId,
        entryDate,
        notes,
        lines,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-emerald-400">Zaman Harcamasi</p>
            <h2 className="text-xl font-bold text-white">{order.p_order_no}</h2>
            <p className="text-sm text-slate-400">
              Ayni emirde birden fazla personel icin toplu sure girisi yapabilirsiniz.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-mono uppercase text-slate-500">Tarih</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-mono uppercase text-slate-500">Not</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsiyonel aciklama"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950/70 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Personel (listeden)</th>
                  <th className="px-3 py-2">Personel Adi</th>
                  <th className="px-3 py-2">Sure (dk)</th>
                  <th className="px-3 py-2 w-16" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-t border-slate-800">
                    <td className="px-3 py-2">
                      <select
                        value={line.operator_id}
                        onChange={(e) => updateLine(index, 'operator_id', e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm"
                      >
                        <option value="">Seciniz</option>
                        {operators.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.full_name} ({op.operator_code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={line.operator_name}
                        onChange={(e) => updateLine(index, 'operator_name', e.target.value)}
                        placeholder="Ad soyad"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={line.minutes_spent}
                        onChange={(e) => updateLine(index, 'minutes_spent', e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeLine(index)} className="text-xs text-rose-400">
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            + Personel satiri ekle
          </button>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
            >
              Iptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? 'Kaydediliyor...' : 'Zaman Harcamasini Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
