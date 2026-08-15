'use client';

import { getStageMeta } from '@/lib/stationStages';

function formatOrderDate(order) {
  const raw = order.start_date || order.record_date || order.order_date || order.created_at;
  if (!raw) return '—';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    const text = String(raw);
    return text.length > 16 ? text.slice(0, 10) : text;
  }
  return date.toLocaleDateString('tr-TR');
}

function stationLabel(order, workstations) {
  const station = workstations.find((ws) => Number(ws.station_id) === Number(order.station_id));
  if (station?.station_name) return station.station_name;
  if (order.station_id != null && order.station_id !== '') return `#${order.station_id}`;
  return '—';
}

export default function StationOrderBoard({
  orders,
  workstations,
  loading,
  onEnter,
}) {
  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-sm text-slate-500">
        Üretim emirleri yükleniyor...
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-dashed border-slate-700 px-4 text-center text-sm text-slate-500">
        Açık üretim emri bulunamadı.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-[44rem] w-full text-sm">
          <thead className="sticky top-0 bg-slate-950/95 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">İstasyon</th>
              <th className="px-3 py-2.5 font-medium">Emir No</th>
              <th className="px-3 py-2.5 font-medium">Ürün</th>
              <th className="px-3 py-2.5 font-medium">Miktar</th>
              <th className="px-3 py-2.5 font-medium">Tarih</th>
              <th className="px-3 py-2.5 font-medium">Statü</th>
              <th className="px-3 py-2.5 text-right font-medium"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {orders.map((order) => {
              const stage = getStageMeta(order.is_stage);
              const canEnter = order.station_id != null && order.station_id !== '';
              return (
                <tr key={order.p_order_id} className="bg-slate-950/20">
                  <td className="px-3 py-2.5 text-slate-300">{stationLabel(order, workstations)}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-white">{order.p_order_no}</td>
                  <td className="max-w-[14rem] truncate px-3 py-2.5 text-slate-300">
                    {order.product_name2 || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-slate-300">
                    {order.counter_value ?? 0} / {order.quantity ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-400">{formatOrderDate(order)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${stage.className}`}>
                      {stage.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={!canEnter}
                      onClick={() => onEnter(order)}
                      className="inline-flex min-h-9 min-w-[3.5rem] items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-bold tracking-wide text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      GİR
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
