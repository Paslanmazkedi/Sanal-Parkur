import { getStageMeta } from '@/lib/stationStages';

export default function StationOrderCard({ order, highlight = false }) {
  const stage = getStageMeta(order.is_stage);
  const target = Number(order.quantity) || 0;
  const actual = Number(order.counter_value) || 0;
  const progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;

  return (
    <article
      className={`rounded-2xl border p-5 transition-all ${
        highlight
          ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-900/10'
          : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-slate-500">Emir No</p>
          <h3 className="text-2xl font-black text-white">{order.p_order_no}</h3>
        </div>
        <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${stage.className}`}>
          {stage.label}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Ürün</dt>
          <dd className="font-medium text-slate-200">{order.product_name2 || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Lot</dt>
          <dd className="font-mono text-slate-200">{order.lot_no || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Hedef</dt>
          <dd className="font-mono text-slate-200">{target}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Gerçekleşen</dt>
          <dd className="font-mono text-emerald-400">{actual}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>İlerleme</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}
