'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { supabase } from '../../supabase';

export default function IotGatewayPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('production_order_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 text-gray-100">
      <PageHeader
        title="IoT Gateway"
        titleClassName="text-violet-100"
        crumbs={[
          { label: 'WEX Lab', href: '/simulator' },
          { label: 'IoT Gateway' },
        ]}
        description="Production order operations canlı akışı."
      />
      {loading && <p className="mb-2 text-sm text-slate-400">Yükleniyor...</p>}
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full bg-slate-900/50 text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-2 text-left">P_ORDER_ID</th>
              <th className="px-4 py-2 text-left">ASSET_ID</th>
              <th className="px-4 py-2 text-left">STATUS_CODE</th>
              <th className="px-4 py-2 text-left">COUNTER_VALUE</th>
              <th className="px-4 py-2 text-left">CREATED_AT</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-700">
                <td className="px-4 py-2">{log.p_order_id}</td>
                <td className="px-4 py-2">{log.asset_id}</td>
                <td className="px-4 py-2">{log.status_code}</td>
                <td className="px-4 py-2">{log.counter_value}</td>
                <td className="px-4 py-2">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
