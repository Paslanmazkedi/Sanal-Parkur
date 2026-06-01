'use client';
import { useState, useEffect } from 'react';
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
    <div className="p-4 bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-2xl font-bold mb-4">IoT Gateway – Production Order Operations</h1>
      {loading && <p className="mb-2">Yükleniyor...</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800">
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