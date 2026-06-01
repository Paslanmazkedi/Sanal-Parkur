// This page manages Production Orders in the Workcube ERP schema.
// Columns: p_order_id (PK), p_order_no, product_name2, lot_no, quantity, station_id, is_stage, result_amount
// The form allows adding an order with all required fields.
// The list displays all order fields with status badges.

'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';

const STAGE_BADGES = {
  4: { label: 'Başlamadı', className: 'bg-sky-500' },
  0: { label: 'Operatöre Gönderildi', className: 'bg-amber-500' },
  1: { label: 'Başladı', className: 'bg-emerald-500' },
  3: { label: 'Üretim Durdu(Arıza)', className: 'bg-slate-400' },
  2: { label: 'Bitti', className: 'bg-rose-500' },
};

export default function ProductionOrdersPage() {
  const [pOrderId, setPOrderId] = useState('');
  const [pOrderNo, setPOrderNo] = useState('');
  const [productName2, setProductName2] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [orders, setOrders] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadOrders();
    loadWorkstations();
  }, []);

  const loadWorkstations = async () => {
    const { data } = await supabase
      .from('workstations')
      .select('station_id,station_name')
      .order('station_id', { ascending: false });
    if (data) setWorkstations(data);
  };

  const loadOrders = async () => {
    const { data: o } = await supabase
      .from('production_orders')
      .select('p_order_id,p_order_no,product_name2,lot_no,quantity,station_id,is_stage,result_amount')
      .order('p_order_id', { ascending: false });
    if (o) setOrders(o);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    const orderData = {
      p_order_id: parseInt(pOrderId),
      p_order_no: pOrderNo,
      product_name2: productName2,
      lot_no: lotNo,
      quantity: quantity,
      station_id: selectedStationId,
      is_stage: 4,
      prod_order_stage: 4,
      result_amount: 0,
    };
    const { error } = await supabase.from('production_orders').insert([orderData]);
    if (!error) {
      setPOrderId('');
      setPOrderNo('');
      setProductName2('');
      setLotNo('');
      setQuantity(0);
      setSelectedStationId('');
      loadOrders();
    }
    setLoading(false);
    setShowModal(false);
  };

  const getStationName = (stationId) => {
    const ws = workstations.find((w) => w.station_id === stationId);
    return ws ? ws.station_name : 'Bilinmiyor';
  };

  const renderBadge = (stage) => {
    const badge = STAGE_BADGES[stage] || { label: 'Bilinmiyor', className: 'bg-gray-500' };
    return (
      <span className={`${badge.className} text-white font-mono text-[11px] font-bold px-2.5 py-1 rounded-md`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Workcube ERP İş Emirleri</h1>
        <p className="text-slate-400 text-sm mt-1">WEX'in eşleştireceği ana Workcube üretim planlama kodları.</p>
      </header>

      {/* Add Order Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
        >
          Yeni İş Emri Ekle
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800/80 shadow-xl z-10 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-sky-400 font-mono uppercase">📦 Yeni İş Emri Ekle</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  P_ORDER_ID (Number)
                </label>
                <input
                  type="number"
                  value={pOrderId}
                  onChange={(e) => setPOrderId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  P_ORDER_NO (Text)
                </label>
                <input
                  type="text"
                  placeholder="Örn: WO-2026-001"
                  value={pOrderNo}
                  onChange={(e) => setPOrderNo(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  PRODUCT_NAME2 (Text)
                </label>
                <input
                  type="text"
                  placeholder="Ürün Adı"
                  value={productName2}
                  onChange={(e) => setProductName2(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  LOT_NO (Text)
                </label>
                <input
                  type="text"
                  placeholder="Parti No"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  QUANTITY (Number)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                  STATION_ID (Select)
                </label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
                  required
                >
                  <option value="">İstasyon Seçin</option>
                  {workstations.map((ws) => (
                    <option key={ws.station_id} value={ws.station_id}>
                      {ws.station_name} (ID: {ws.station_id})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-sky-900/20 active:scale-95"
              >
                {loading ? 'ERP İletişimi...' : '+ Workcube Havuzuna Gönder'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-sm">
        <h2 className="text-sm font-bold text-slate-300 mb-4 font-mono uppercase tracking-wider">
          📋 Aktif Sipariş & Üretim Emirleri ({orders.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Emir No</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Ürün Adı</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Lot No</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">İstasyon</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Hedef</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Gerçekleşen</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.p_order_id} className="border-b border-slate-800/50 hover:bg-slate-950/20 transition-colors">
                  <td className="py-3 px-3 text-slate-200 font-mono">{o.p_order_no}</td>
                  <td className="py-3 px-3 text-slate-300">{o.product_name2}</td>
                  <td className="py-3 px-3 text-slate-300 font-mono">{o.lot_no}</td>
                  <td className="py-3 px-3 text-slate-300">{getStationName(o.station_id)}</td>
                  <td className="py-3 px-3 text-slate-300">{o.quantity}</td>
                  <td className="py-3 px-3 text-slate-300">{o.result_amount}</td>
                  <td className="py-3 px-3">{renderBadge(o.is_stage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}