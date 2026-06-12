'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

  // Default JSON template aligned with original Postman model (minimal required fields)
  // Updated default payload for "Çatı Makası" work order
// Updated default JSON template matching the new schema
// Updated default JSON template matching the new schema with is_stage
const DEFAULT_JSON = {
  p_order_no: "UE-13",
  station_id: 54,
  is_stage: 3,
  counter_value: 5,
};

const JSON_FORMAT_STORAGE_KEY = 'sanal_parkur_json_formats';

export default function SimulatorPage() {
  const [orders, setOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [jsonFormats, setJsonFormats] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedMachineKey, setSelectedMachineKey] = useState('');
  const [selectedDispatchMachineId, setSelectedDispatchMachineId] = useState('');
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  // Initialize JSON payload as empty to avoid stale data on first render
  const [jsonBody, setJsonBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [definitionsTab, setDefinitionsTab] = useState('machines');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('machine-add');
  const [editMachineData, setEditMachineData] = useState(null);
  const [editFormatData, setEditFormatData] = useState(null);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });

  const buildSignalPayload = (order, currentJson = DEFAULT_JSON) => ({
    ...currentJson,
    p_order_no: order.p_order_no,
    station_id: order.station_id,
    is_stage: Object.prototype.hasOwnProperty.call(currentJson, 'is_stage') ? currentJson.is_stage : 3,
    counter_value: Object.prototype.hasOwnProperty.call(currentJson, 'counter_value') ? currentJson.counter_value : 0,
  });

  // Load initial selection data and set default JSON payload
  useEffect(() => {
    const loadSelectionData = async () => {
      const { data: o, error: ordersError } = await supabase
        .from('production_orders')
        .select('*')
        .order('p_order_id', { ascending: false });
      const { data: m, error: machinesError } = await supabase
        .from('machines')
        .select('id,machine_code,machine_name,machine_key,connection_type,ip_address,port_number,com_port,protocol,station_id,status,created_at')
        .order('id', { ascending: true });

      if (ordersError || machinesError) {
        setResult({
          success: false,
          msg: [
            ordersError ? `Üretim emirleri yüklenemedi: ${ordersError.message}` : null,
            machinesError ? `Makina verileri yüklenemedi: ${machinesError.message}` : null,
          ].filter(Boolean).join(' | '),
        });
      } else if ((o?.length ?? 0) === 0 || (m?.length ?? 0) === 0) {
        setResult({
          success: false,
          msg: [
            (o?.length ?? 0) === 0 ? 'Üretim emri bulunamadı veya erişim politikası satırları gizliyor.' : null,
            (m?.length ?? 0) === 0 ? 'Makina kaydı bulunamadı veya erişim politikası satırları gizliyor.' : null,
          ].filter(Boolean).join(' | '),
        });
      }

      if (o) {
        setOrders(o);
        const initialOrder = o.find((order) => [0, 1].includes(Number(order.is_stage))) || o[0];
        if (initialOrder) {
          setSelectedOrderId(initialOrder.p_order_id);
          setJsonBody(JSON.stringify(buildSignalPayload(initialOrder), null, 2));
        } else {
          setJsonBody(JSON.stringify(DEFAULT_JSON, null, 2));
        }
      }
      if (m) {
        setMachines(m);
        if (m.length > 0) {
          setSelectedMachineKey(m[0].machine_key);
          setSelectedDispatchMachineId(m[0].id);
        }
      }
    };

    loadSelectionData();
  }, []);

  useEffect(() => {
    try {
      const savedFormats = JSON.parse(localStorage.getItem(JSON_FORMAT_STORAGE_KEY) || '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(savedFormats)) setJsonFormats(savedFormats);
    } catch (_) {
      setJsonFormats([]);
    }
  }, []);

  const persistJsonFormats = (nextFormats) => {
    setJsonFormats(nextFormats);
    localStorage.setItem(JSON_FORMAT_STORAGE_KEY, JSON.stringify(nextFormats));
  };

  const selectedMachine = machines.find((machine) => String(machine.machine_key) === String(selectedMachineKey));
  const activeProductionOrders = orders.filter((order) => [0, 1].includes(Number(order.is_stage)));
  const visibleProductionOrders = activeProductionOrders.length > 0 ? activeProductionOrders : orders;

  const syncOrderInJson = (orderId) => {
    setSelectedOrderId(orderId);
    const selectedOrder = orders.find((order) => String(order.p_order_id) === String(orderId));

    try {
      const currentJson = JSON.parse(jsonBody || '{}');
      setJsonBody(JSON.stringify(
        selectedOrder
          ? buildSignalPayload(selectedOrder, currentJson)
          : currentJson,
        null,
        2,
      ));
    } catch (_) {
      setJsonBody(JSON.stringify(
        selectedOrder
          ? buildSignalPayload(selectedOrder, { ...DEFAULT_JSON, machine_key: selectedMachineKey })
          : { ...DEFAULT_JSON, machine_key: selectedMachineKey },
        null,
        2,
      ));
    }
  };

  const syncMachineKeyInJson = (machineKey) => {
    setSelectedMachineKey(machineKey);
    setSelectedFormatId('');

    try {
      const currentJson = JSON.parse(jsonBody || '{}');
      setJsonBody(JSON.stringify({ ...currentJson, machine_key: machineKey }, null, 2));
    } catch (_) {
      setJsonBody(JSON.stringify({ ...DEFAULT_JSON, machine_key: machineKey }, null, 2));
    }
  };

  const applyJsonFormat = (formatId) => {
    setSelectedFormatId(formatId);
    // When "Manuel Canlı Paket" (empty) is selected, load the default JSON template
    if (!formatId) {
      setJsonBody(JSON.stringify(DEFAULT_JSON, null, 2));
      return;
    }
    const format = jsonFormats.find((item) => String(item.id) === String(formatId));
    if (!format) return;
    setJsonBody(format.body);
    if (format.machine_key) setSelectedMachineKey(format.machine_key);
  };

  // Sends the live signal using the exact JSON the user typed.
  const handleSendSignal = async () => {
    setLoading(true);
    setResult(null);

    // Parse the raw textarea content – this must be the exact payload sent to the API.
    let parsedBody = {};
    try {
      parsedBody = JSON.parse(jsonBody);
    } catch (_) {
      setResult({ success: false, msg: 'JSON formatı geçersiz. Lütfen canlı paket içeriğini kontrol edin.' });
      setLoading(false);
      return;
    }

    // No hard‑coded overrides – forward the parsed object directly.
    const payload = parsedBody;

    try {
      const response = await fetch('/api/wex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wex-api-key': '9dd683bc664e5727a20b6f78760bae8652dd3c47e601eaa605d541bc01ef589e',
          ...(deviceKey.trim() ? { 'x-device-key': deviceKey.trim() } : {}),
        },
        body: JSON.stringify(payload),
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setResult({ success: true, msg: 'Gelen paket WEX hattından başarıyla aktı, veritabanı güncellendi.' });
      } else {
        setResult({ success: false, msg: `Hata: ${resData.error || `HTTP ${response.status}`}` });
      }
    } catch (_) {
      setResult({ success: false, msg: 'Ağ/Bağlantı hatası oluştu.' });
    }

    setLoading(false);
  };

  const handleDispatchOrder = async () => {
    const selectedOrder = orders.find((order) => String(order.p_order_id) === String(selectedOrderId));
    const targetMachine = machines.find((machine) => String(machine.id) === String(selectedDispatchMachineId));

    if (!selectedOrder || !targetMachine) {
      setResult({ success: false, msg: 'Hedef iş emri veya makine seçimi eksik.' });
      return;
    }

    setDispatchLoading(true);
    setResult(null);

    const updatePayload = {
      status: 'POOL',
      machine_id: targetMachine.id,
    };

    if (Object.prototype.hasOwnProperty.call(selectedOrder, 'is_stage')) updatePayload.is_stage = 0;
    if (Object.prototype.hasOwnProperty.call(selectedOrder, 'prod_order_stage')) updatePayload.prod_order_stage = 0;

    const { data, error } = await supabase
      .from('production_orders')
      .update(updatePayload)
      .eq('p_order_id', selectedOrder.p_order_id)
      .select()
      .single();

    if (error) {
      setResult({ success: false, msg: `İş emri makinaya iletilemedi: ${error.message}` });
    } else {
      setOrders((currentOrders) => currentOrders.map((order) => (
        order.p_order_id === selectedOrder.p_order_id ? { ...order, ...data } : order
      )));
      setResult({
        success: true,
        tone: 'amber',
        msg: 'İş Emri Başarıyla İlgili Makinaya İletildi, Üretim Havuzuna Düştü',
      });
    }

    setDispatchLoading(false);
  };

  const submitMachine = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      machine_code: formData.get('machine_code'),
      machine_name: formData.get('machine_name'),
      machine_key: formData.get('machine_key'),
      connection_type: formData.get('connection_type'),
      ip_address: formData.get('ip_address') || null,
      port_number: formData.get('port_number') ? Number(formData.get('port_number')) : null,
      com_port: formData.get('com_port') || null,
      protocol: formData.get('protocol'),
      station_id: formData.get('station_id') || null,
      status: formData.get('status') || 'active',
    };

    let error;
    if (modalMode === 'machine-add') {
      ({ error } = await supabase.from('machines').insert(payload));
    } else if (modalMode === 'machine-edit' && editMachineData) {
      ({ error } = await supabase.from('machines').update(payload).eq('machine_key', editMachineData.machine_key));
    }

    if (error) {
      alert('İşlem hatası: ' + error.message);
      return;
    }

    const { data: refreshed } = await supabase
      .from('machines')
      .select('id,machine_code,machine_name,machine_key,connection_type,ip_address,port_number,com_port,protocol,station_id,status,created_at')
      .order('id', { ascending: true });
    if (refreshed) setMachines(refreshed);
    setIsModalOpen(false);
  };

  const submitJsonFormat = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = String(formData.get('body') || '').trim();
    const relatedMachine = machines.find((machine) => String(machine.id) === String(formData.get('machine_id')));

    try {
      JSON.parse(body);
    } catch (_) {
      alert('JSON formatı geçersiz. Lütfen şablonu kontrol edin.');
      return;
    }

    const formatPayload = {
      id: editFormatData?.id || Date.now(),
      name: formData.get('name'),
      machine_id: relatedMachine?.id || formData.get('machine_id'),
      machine_key: relatedMachine?.machine_key || '',
      body: JSON.stringify(JSON.parse(body), null, 2),
      updated_at: new Date().toISOString(),
    };

    const nextFormats = editFormatData
      ? jsonFormats.map((format) => (format.id === editFormatData.id ? formatPayload : format))
      : [formatPayload, ...jsonFormats];

    persistJsonFormats(nextFormats);
    setDefinitionsTab('formats');
    setSelectedFormatId(formatPayload.id);
    setJsonBody(formatPayload.body);
    setSelectedMachineKey(formatPayload.machine_key);
    setIsModalOpen(false);
  };

  const deleteMachine = async (machineKey) => {
    if (!confirm('Bu makineyi silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('machines').delete().eq('machine_key', machineKey);
    if (!error) {
      setMachines(machines.filter((machine) => machine.machine_key !== machineKey));
    } else {
      alert('Silme hatası: ' + error.message);
    }
  };

  const deleteJsonFormat = (formatId) => {
    if (!confirm('Bu JSON formatını silmek istediğinize emin misiniz?')) return;
    const nextFormats = jsonFormats.filter((format) => format.id !== formatId);
    persistJsonFormats(nextFormats);
    if (String(selectedFormatId) === String(formatId)) setSelectedFormatId('');
  };

  const centerModal = () => {
    const x = Math.max(16, Math.floor(window.innerWidth / 2) - 280);
    const y = Math.max(16, Math.floor(window.innerHeight / 2) - 260);
    setModalPos({ x, y });
  };

  const openMachineModal = (machine = null) => {
    setModalMode(machine ? 'machine-edit' : 'machine-add');
    setEditMachineData(machine);
    setEditFormatData(null);
    setIsModalOpen(true);
    centerModal();
  };

  const openJsonFormatModal = (format = null) => {
    setModalMode(format ? 'format-edit' : 'format-add');
    setEditFormatData(format);
    setEditMachineData(null);
    setIsModalOpen(true);
    centerModal();
  };

  const onMouseDownHeader = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const move = (ev) => {
      setModalPos({ x: ev.clientX - offset.x, y: ev.clientY - offset.y });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const getMachineLabel = (machineId, machineKey) => {
    const machine = machines.find((item) => String(item.id) === String(machineId) || String(item.machine_key) === String(machineKey));
    return machine ? `${machine.machine_code} (ID: ${machine.id})` : 'Makine seçilmedi';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-xl font-medium ${activeTab === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          onClick={() => setActiveTab(1)}
        >
          1. Gelen Paket
        </button>
        <button
          className={`px-4 py-2 rounded-xl font-medium ${activeTab === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          onClick={() => setActiveTab(2)}
        >
          2. Makinaya Giden Emir
        </button>
      </div>

      <header>
        <h1 className="text-3xl font-black text-white tracking-tight"> Demir Şahin Simülatör</h1>
        <p className="text-slate-400 text-sm mt-1">Saha cihazı, Entegrasyon kapısı ve üretim havuzu arasındaki canlı paket akışını yönetimi</p>
      </header>

      {result && (
        <div className={`p-4 rounded-xl border text-sm font-mono font-semibold transition-all ${
          result.success
            ? result.tone === 'amber'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/20'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/20'
            : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
        }`}>
          [{result.success ? 'OK' : 'FAIL'}] {result.msg}
        </div>
      )}

      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 shadow-2xl backdrop-blur-sm space-y-6">
        {activeTab === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Aktif Üretim Emri</label>
                <select value={selectedOrderId} onChange={(e) => syncOrderInJson(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500">
                  {visibleProductionOrders.map((order) => (
                    <option key={order.p_order_id} value={order.p_order_id}>
                      {order.p_order_no || order.order_code || 'Emir'} - {order.product_name2 || order.product_name || 'Ürün'} (ID: {order.p_order_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Paketin Geldiği Makine</label>
                <select value={selectedMachineKey} onChange={(e) => syncMachineKeyInJson(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500">
                  {machines.map((machine) => (
                    <option key={machine.machine_key} value={machine.machine_key}>
                      {machine.machine_code} (Key: {machine.machine_key})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Kayıtlı JSON Formatı</label>
          <select value={selectedFormatId} onChange={(e) => applyJsonFormat(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500">
            <option value="">Manuel Canlı Paket (Boş Editör)</option>
                  {jsonFormats.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.name} - {getMachineLabel(format.machine_id, format.machine_key)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest">Canlı Sinyal Paketi</label>
                <span className="text-[11px] font-mono text-slate-600">{selectedMachine?.machine_code || 'Makine seçilmedi'}</span>
              </div>
              <textarea value={jsonBody} onChange={(e) => setJsonBody(e.target.value)} rows={10} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono" />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Cihaz Key (Opsiyonel)</label>
              <input value={deviceKey} onChange={(e) => setDeviceKey(e.target.value)} placeholder="integration_devices.device_key" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono" />
            </div>

            <button onClick={handleSendSignal} disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-black py-3.5 rounded-xl shadow-xl shadow-emerald-950/30 transition-all active:scale-[0.99] tracking-wider uppercase text-sm">
              {loading ? 'Paket WEX Hattına Aktarılıyor...' : 'Canlı Sinyali Fırlat'}
            </button>
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Hedef İş Emri (Workcube)</label>
              <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500">
                {visibleProductionOrders.map((order) => (
                  <option key={order.p_order_id} value={order.p_order_id}>
                    {order.p_order_no} - {order.product_name2} (ID: {order.p_order_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Bu Emrin Gönderileceği Makine</label>
              <select value={selectedDispatchMachineId} onChange={(e) => setSelectedDispatchMachineId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500">
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.machine_code} (ID: {machine.id}{machine.machine_key ? ` / Key: ${machine.machine_key}` : ''})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 mt-4">
              <button onClick={handleDispatchOrder} disabled={dispatchLoading || orders.length === 0 || machines.length === 0} className="w-full bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-black py-3.5 rounded-xl shadow-xl shadow-emerald-950/30 transition-all active:scale-[0.99] tracking-wider uppercase text-sm">
                {dispatchLoading ? 'Emir Üretim Havuzuna Aktarılıyor...' : 'Üretim Emrini Havuza/Makinaya Gönder'}
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="mt-8 space-y-6 bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold text-white">Haberleşme Tanımları</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openMachineModal()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
              Makina Ekle
            </button>
            <button onClick={() => openJsonFormatModal()} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold">
              JSON Formatı Ekle
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-800 pb-3">
          <button onClick={() => setDefinitionsTab('machines')} className={`px-3 py-2 rounded-lg text-sm font-medium ${definitionsTab === 'machines' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            Tanımlı Makinalar
          </button>
          <button onClick={() => setDefinitionsTab('formats')} className={`px-3 py-2 rounded-lg text-sm font-medium ${definitionsTab === 'formats' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            JSON Formatları
          </button>
        </div>

        {definitionsTab === 'machines' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {machines.map((machine) => (
              <div key={machine.machine_key} className="relative p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className={`absolute top-2 right-2 h-3 w-3 rounded-full ${
                  machine.status === 'active' ? 'bg-emerald-500' : machine.status === 'offline' ? 'bg-gray-500' : 'bg-amber-500'
                }`}></span>
                <p className="text-sm text-slate-300"><strong>Kod:</strong> {machine.machine_code}</p>
                <p className="text-sm text-slate-300"><strong>Ad:</strong> {machine.machine_name}</p>
                <p className="text-sm text-slate-300"><strong>ID:</strong> {machine.id}</p>
                <p className="text-sm text-slate-300"><strong>Key:</strong> {machine.machine_key}</p>
                <p className="text-sm text-slate-300"><strong>Bağlantı:</strong> {machine.connection_type}</p>
                <p className="text-sm text-slate-300"><strong>Adres:</strong> {machine.ip_address || machine.com_port || '-'}</p>
                <p className="text-sm text-slate-300"><strong>Port:</strong> {machine.port_number || '-'}</p>
                <p className="text-sm text-slate-300"><strong>Protokol:</strong> {machine.protocol}</p>
                <p className="text-sm text-slate-300"><strong>Durum:</strong> {machine.status || 'active'}</p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => openMachineModal(machine)} className="text-xs text-amber-400 hover:text-amber-300">Düzenle</button>
                  <button onClick={() => deleteMachine(machine.machine_key)} className="text-xs text-rose-400 hover:text-rose-300">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {definitionsTab === 'formats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jsonFormats.length === 0 && (
              <div className="md:col-span-2 rounded-xl border border-dashed border-slate-700 p-6 text-sm text-slate-500">
                Henüz JSON formatı tanımlanmadı.
              </div>
            )}
            {jsonFormats.map((format) => (
              <div key={format.id} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{format.name}</h3>
                  <p className="text-xs text-slate-400">{getMachineLabel(format.machine_id, format.machine_key)}</p>
                </div>
                <pre className="max-h-44 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-300 font-mono">{format.body}</pre>
                <div className="flex gap-3">
                  <button onClick={() => applyJsonFormat(format.id)} className="text-xs text-emerald-400 hover:text-emerald-300">Pakete Al</button>
                  <button onClick={() => openJsonFormatModal(format)} className="text-xs text-amber-400 hover:text-amber-300">Düzenle</button>
                  <button onClick={() => deleteJsonFormat(format.id)} className="text-xs text-rose-400 hover:text-rose-300">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setIsModalOpen(false)}>
          <div className="absolute w-[calc(100vw-2rem)] max-w-2xl bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl" style={{ top: modalPos.y, left: modalPos.x }} onClick={(e) => e.stopPropagation()}>
            <div className="cursor-move bg-slate-800 p-3 rounded-t flex items-center justify-between" onMouseDown={onMouseDownHeader}>
              <span className="text-sm text-slate-300 font-semibold">
                {modalMode.startsWith('format') ? 'JSON Formatı Tanımı' : 'Makina Tanımı'}
              </span>
              <button className="text-slate-400 hover:text-white" onClick={() => setIsModalOpen(false)}>x</button>
            </div>

            {modalMode.startsWith('machine') && (
              <form onSubmit={submitMachine} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <input name="machine_code" required placeholder="Makine Kodu" defaultValue={editMachineData?.machine_code || ''} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <input name="machine_name" required placeholder="Makine Adı" defaultValue={editMachineData?.machine_name || ''} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <input name="machine_key" required type="text" placeholder="Makine Key" defaultValue={editMachineData?.machine_key || ''} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <select name="connection_type" required defaultValue={editMachineData?.connection_type || 'TCP_IP'} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800">
                  <option value="TCP_IP">TCP/IP</option>
                  <option value="SERIAL">Serial</option>
                </select>
                <input name="ip_address" placeholder="IP Adresi" defaultValue={editMachineData?.ip_address || ''} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <input name="port_number" type="number" placeholder="Port" defaultValue={editMachineData?.port_number || ''} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <input name="com_port" placeholder="COM Port" defaultValue={editMachineData?.com_port || ''} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <input name="protocol" required placeholder="Protokol" defaultValue={editMachineData?.protocol || 'Modbus-TCP'} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <input name="station_id" placeholder="İstasyon ID" defaultValue={editMachineData?.station_id || ''} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <select name="status" required defaultValue={editMachineData?.status || 'active'} className="bg-slate-950 text-white rounded-xl p-3 border border-slate-800">
                  <option value="active">active</option>
                  <option value="offline">offline</option>
                  <option value="maintenance">maintenance</option>
                </select>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">Vazgeç</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded">Kaydet</button>
                </div>
              </form>
            )}

            {modalMode.startsWith('format') && (
              <form onSubmit={submitJsonFormat} className="space-y-4 mt-4">
                <input name="name" required placeholder="Format Adı" defaultValue={editFormatData?.name || ''} className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-800" />
                <select name="machine_id" required defaultValue={editFormatData?.machine_id || selectedMachine?.id || ''} className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-800">
                  <option value="">İlişkili Makine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_code} (ID: {machine.id} / Key: {machine.machine_key})
                    </option>
                  ))}
                </select>
                <textarea name="body" required rows={10} defaultValue={editFormatData?.body || jsonBody} className="w-full bg-slate-950 text-emerald-300 rounded-xl p-3 border border-slate-800 font-mono text-sm" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">Vazgeç</button>
                  <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded">Kaydet</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
