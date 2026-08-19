'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import OeeMetricBar from '@/components/station/OeeMetricBar';
import PageHeader from '@/components/PageHeader';
import { getOeeBorderClass, getOeeTextClass, summarizeStations } from '@/lib/oee';
import { getStageMeta } from '@/lib/stationStages';
import { supabase } from '../supabase';

const POLL_MS = 8000;

function OeeStationCard({ item }) {
  const { station, activeOrder, queueCount, metrics, statusStage } = item;
  const stage = statusStage !== null ? getStageMeta(statusStage) : null;
  const progress =
    activeOrder && Number(activeOrder.quantity) > 0
      ? Math.min(100, ((Number(activeOrder.counter_value) || 0) / Number(activeOrder.quantity)) * 100)
      : 0;

  return (
    <Link
      href={`/station?station=${station.station_id}`}
      className={`group block rounded-2xl border bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-slate-900/80 ${getOeeBorderClass(metrics.oee)}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Istasyon #{station.station_id}</p>
          <h2 className="text-lg font-bold text-white group-hover:text-emerald-300">{station.station_name}</h2>
          <p className="text-xs text-slate-500">{station.branch || '—'} · {station.department || '—'}</p>
        </div>
        {stage && (
          <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold ${stage.className}`}>
            {stage.label}
          </span>
        )}
      </div>

      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">OEE</p>
          <p className={`text-4xl font-black ${getOeeTextClass(metrics.oee)}`}>{metrics.oee}%</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Kuyruk: {queueCount}</p>
          <p>{station.active ? 'Aktif istasyon' : 'Pasif istasyon'}</p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <OeeMetricBar label="A" value={metrics.availability} tone="sky" />
        <OeeMetricBar label="P" value={metrics.performance} tone="emerald" />
        <OeeMetricBar label="Q" value={metrics.quality} tone="amber" />
      </div>

      {activeOrder ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="font-mono text-xs text-slate-500">{activeOrder.p_order_no}</p>
          <p className="truncate text-sm font-medium text-slate-200">{activeOrder.product_name2}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-right text-[10px] text-slate-500">
            {activeOrder.counter_value ?? 0} / {activeOrder.quantity ?? 0}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700 px-3 py-4 text-center text-xs text-slate-500">
          Aktif emir yok
        </div>
      )}
    </Link>
  );
}

export default function OeeMonitorPage() {
  const [workstations, setWorkstations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async () => {
    const [stationsRes, ordersRes] = await Promise.all([
      supabase
        .from('workstations')
        .select('station_id,station_name,branch,department,active,capacity')
        .order('station_id', { ascending: true }),
      supabase
        .schema('production')
        .from('production_orders')
        .select('p_order_id,p_order_no,product_name2,lot_no,quantity,counter_value,station_id,is_stage')
        .in('is_stage', [0, 1, 3, 4]),
    ]);

    if (stationsRes.error || ordersRes.error) {
      setError(stationsRes.error?.message || ordersRes.error?.message || 'Veri yuklenemedi.');
      setLoading(false);
      return;
    }

    setWorkstations(stationsRes.data || []);
    setOrders(ordersRes.data || []);
    setError('');
    setLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    loadData();
    const poll = setInterval(loadData, POLL_MS);
    return () => clearInterval(poll);
  }, []);

  const summaries = useMemo(
    () => summarizeStations(workstations.filter((s) => s.active !== 0), orders),
    [workstations, orders],
  );

  const avgOee = summaries.length
    ? Math.round((summaries.reduce((sum, item) => sum + item.metrics.oee, 0) / summaries.length) * 10) / 10
    : 0;

  const runningCount = summaries.filter((item) => Number(item.statusStage) === 1).length;
  const faultCount = summaries.filter((item) => Number(item.statusStage) === 3).length;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        title="OEE"
        titleClassName="text-amber-100"
        crumbs={[
          { label: 'Raporlar', href: '/oee' },
          { label: 'OEE' },
        ]}
        description="Tüm istasyonlar için dinamik OEE kartları. MVP hesap; veritabanı genişledikçe gerçek metriklere dönüşür."
        actions={
          <>
            <Link
              href="/station"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-white"
            >
              Operatör paneli
            </Link>
            {lastUpdated && (
              <span className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-500">
                Guncelleme: {lastUpdated.toLocaleTimeString('tr-TR', { hour12: false })}
              </span>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Ortalama OEE</p>
          <p className={`mt-2 text-4xl font-black ${getOeeTextClass(avgOee)}`}>{avgOee}%</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Uretimde</p>
          <p className="mt-2 text-4xl font-black text-emerald-400">{runningCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">Ariza / Durus</p>
          <p className="mt-2 text-4xl font-black text-rose-400">{faultCount}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Istasyon verileri yukleniyor...</div>
      ) : summaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-20 text-center text-slate-500">
          Aktif istasyon bulunamadı. Önce İstasyonlar sayfasından tanımlayın.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((item) => (
            <OeeStationCard key={item.station.station_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
