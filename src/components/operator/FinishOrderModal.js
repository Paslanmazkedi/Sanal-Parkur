'use client';

import { useEffect, useState } from 'react';
import BasketGrid from '@/components/operator/BasketGrid';
import { BASKET_TYPES, EMPTY_BASKET_LINE } from '@/lib/operatorConstants';
import { postFinishReport } from '@/lib/operatorApi';

function buildInitialProduced(order) {
  return [
    {
      stock_code: '',
      product_name: order?.product_name2 || '',
      spec: '',
      lot_no: order?.lot_no || '',
      serial_no: '',
      quantity: order?.quantity ? String(order.quantity) : '',
      unit: 'Adet',
    },
  ];
}

export default function FinishOrderModal({ open, onClose, order, stationId, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [produced, setProduced] = useState([{ ...EMPTY_BASKET_LINE }]);
  const [consumed, setConsumed] = useState([]);
  const [scrap, setScrap] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !order) return;
    setNotes('');
    setProduced(buildInitialProduced(order));
    setConsumed([]);
    setScrap([]);
    setError('');
  }, [open, order]);

  if (!open || !order) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await postFinishReport({
        pOrderId: order.p_order_id,
        stationId,
        notes,
        produced,
        consumed,
        scrap,
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
      <div className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-rose-400">Bitir — Uretim Kapatma</p>
            <h2 className="text-xl font-bold text-white">{order.p_order_no}</h2>
            <p className="text-sm text-slate-400">
              Uretilen, tuketilen sarf ve fire basketlerini doldurup emri tamamlayin.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-[11px] font-mono uppercase text-slate-500">Kapanis Notu</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsiyonel"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <BasketGrid
            title={BASKET_TYPES.produced.label}
            tone={BASKET_TYPES.produced.tone}
            lines={produced}
            onChange={setProduced}
            onAddLine={() => setProduced((prev) => [...prev, { ...EMPTY_BASKET_LINE }])}
            onRemoveLine={(index) => setProduced((prev) => prev.filter((_, i) => i !== index))}
          />

          <BasketGrid
            title={BASKET_TYPES.consumed.label}
            tone={BASKET_TYPES.consumed.tone}
            lines={consumed}
            onChange={setConsumed}
            onAddLine={() => setConsumed((prev) => [...prev, { ...EMPTY_BASKET_LINE }])}
            onRemoveLine={(index) => setConsumed((prev) => prev.filter((_, i) => i !== index))}
          />

          <BasketGrid
            title={BASKET_TYPES.scrap.label}
            tone={BASKET_TYPES.scrap.tone}
            lines={scrap}
            onChange={setScrap}
            onAddLine={() => setScrap((prev) => [...prev, { ...EMPTY_BASKET_LINE }])}
            onRemoveLine={(index) => setScrap((prev) => prev.filter((_, i) => i !== index))}
          />

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
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
            >
              {submitting ? 'Tamamlaniyor...' : 'Bitir ve Emri Kapat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
