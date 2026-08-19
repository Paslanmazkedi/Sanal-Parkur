'use client';

import Link from 'next/link';
import { PRODUCTION_ORDERS_HREF } from '@/lib/navigation';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { getStageMeta } from '@/lib/stationStages';
import { supabase } from '../supabase';

export default function LotRecordsPage() {
  const [records, setRecords] = useState([]);
  const [stations, setStations] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);

      const [ordersRes, stationsRes] = await Promise.all([
        supabase
          .schema('production')
          .from('production_orders')
          .select('p_order_id,p_order_no,product_name2,lot_no,quantity,counter_value,station_id,is_stage')
          .not('lot_no', 'is', null)
          .neq('lot_no', '')
          .order('p_order_id', { ascending: false }),
        supabase.from('workstations').select('station_id,station_name'),
      ]);

      if (ordersRes.error) {
        console.error('Lot kayıtları yüklenemedi:', ordersRes.error);
      } else {
        setRecords(ordersRes.data || []);
      }

      const stationMap = {};
      (stationsRes.data || []).forEach((station) => {
        stationMap[station.station_id] = station.station_name;
      });
      setStations(stationMap);
      setLoading(false);
    };

    loadRecords();
  }, []);

  const filteredRecords = records.filter((record) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [
      record.lot_no,
      record.p_order_no,
      record.product_name2,
      stations[record.station_id],
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <header className="space-y-3">
        <PageHeader
          title="Lot Kayıtları"
          titleClassName="text-violet-100"
          crumbs={[
            { label: 'Üretim', href: '/station' },
            { label: 'Lot Kayıtları' },
          ]}
          description="Üretim emirlerindeki lot numaraları ve ilişkili sipariş bilgileri."
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Lot, emir no veya ürün ara..."
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
        />
      </header>

      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="min-w-[48rem] w-full text-sm">
          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Lot No</th>
              <th className="px-4 py-3 font-medium">Emir No</th>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">İstasyon</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium text-right">Miktar</th>
              <th className="px-4 py-3 font-medium text-right">Sayaç</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Lot kaydı bulunamadı.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const stage = getStageMeta(record.is_stage);

                return (
                  <tr key={record.p_order_id} className="bg-slate-900/30 hover:bg-slate-900/60">
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-300">{record.lot_no}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={PRODUCTION_ORDERS_HREF}
                        className="font-mono text-slate-200 hover:text-emerald-300"
                      >
                        {record.p_order_no}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{record.product_name2 || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {stations[record.station_id]
                        ? `${stations[record.station_id]} (#${record.station_id})`
                        : record.station_id ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${stage.className}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{record.quantity ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{record.counter_value ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Link href={PRODUCTION_ORDERS_HREF} className="inline-flex text-sm text-emerald-400 hover:underline">
        ← Üretim emirlerine dön
      </Link>
    </div>
  );
}
