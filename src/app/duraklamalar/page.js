'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { getStageMeta } from '@/lib/stationStages';
import { supabase } from '../supabase';

function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('tr-TR');
}

const STAGE_DOT = {
  sky: 'bg-sky-400',
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  rose: 'bg-rose-400',
  slate: 'bg-slate-400',
};

function StatusText({ label, tone = 'slate' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-200">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STAGE_DOT[tone] || STAGE_DOT.slate}`} aria-hidden />
      {label}
    </span>
  );
}

function durationLabel(startedAt, endedAt) {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} sa ${rest} dk` : `${hours} sa`;
}

export default function DowntimeReportPage() {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [ordersRes, stationsRes, eventsRes] = await Promise.all([
        supabase
          .from('production_orders')
          .select('p_order_id,p_order_no,product_name2,station_id,is_stage,quantity,counter_value')
          .eq('is_stage', 3)
          .order('p_order_id', { ascending: true }),
        supabase.from('workstations').select('station_id,station_name').order('station_id', { ascending: true }),
        supabase
          .from('downtime_events')
          .select('id,station_id,wex_p_order_id,reason_label,category,started_at,ended_at,duration_sec')
          .order('started_at', { ascending: false })
          .limit(100),
      ]);

      if (ordersRes.error) setError(ordersRes.error.message);
      else setError('');

      setOrders(ordersRes.data || []);
      setStations(stationsRes.data || []);
      setEvents(eventsRes.error ? [] : eventsRes.data || []);
      setLoading(false);
    };

    load();
  }, []);

  const stationName = useMemo(() => {
    const map = new Map(stations.map((ws) => [Number(ws.station_id), ws.station_name]));
    return (id) => map.get(Number(id)) || (id != null ? `#${id}` : '—');
  }, [stations]);

  const openEvents = events.filter((event) => !event.ended_at);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Duraklamalar"
        titleClassName="text-amber-100"
        crumbs={[
          { label: 'Raporlar', href: '/oee' },
          { label: 'Duraklamalar' },
        ]}
        description="Duraklatılmış emirler ve kaydedilmiş duruşlar."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Duraklatılmış emir</p>
          <p className="mt-2 text-4xl font-black text-amber-300">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Açık duruş</p>
          <p className="mt-2 text-4xl font-black text-rose-300">{openEvents.length}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <div id="aktif" className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Duraklatılmış üretim emirleri</h2>
        </div>
        <table className="min-w-[40rem] w-full text-sm">
          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">İstasyon</th>
              <th className="px-4 py-3 font-medium">Emir No</th>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Miktar</th>
              <th className="px-4 py-3 font-medium">Statü</th>
              <th className="px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Duraklatılmış emir yok.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const stage = getStageMeta(order.is_stage);
                return (
                  <tr key={order.p_order_id} className="bg-slate-900/30">
                    <td className="px-4 py-3 text-slate-300">{stationName(order.station_id)}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{order.p_order_no}</td>
                    <td className="px-4 py-3 text-slate-300">{order.product_name2 || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {order.counter_value ?? 0} / {order.quantity ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText label={stage.label} tone={stage.tone} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/station?station=${order.station_id}&order=${order.p_order_id}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-500"
                      >
                        İstasyona Git
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Duruş kayıtları</h2>
        </div>
        <table className="min-w-[44rem] w-full text-sm">
          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">İstasyon</th>
              <th className="px-4 py-3 font-medium">Neden</th>
              <th className="px-4 py-3 font-medium">Başlangıç</th>
              <th className="px-4 py-3 font-medium">Süre</th>
              <th className="px-4 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Henüz duruş kaydı yok. Operatör duraklatınca burada listelenecek.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="bg-slate-900/30">
                  <td className="px-4 py-3 text-slate-300">{stationName(event.station_id)}</td>
                  <td className="px-4 py-3 text-white">{event.reason_label || event.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{formatWhen(event.started_at)}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {event.duration_sec
                      ? `${Math.round(event.duration_sec / 60)} dk`
                      : durationLabel(event.started_at, event.ended_at)}
                  </td>
                    <td className="px-4 py-3">
                      {event.ended_at ? (
                        <StatusText label="Kapandı" tone="slate" />
                      ) : (
                        <StatusText label="Açık" tone="amber" />
                      )}
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
