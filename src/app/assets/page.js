// This page manages Workstations (stations) in the Workcube ERP schema.
// Columns: station_id (PK), station_name, asset_id, capacity, cost, cost_money, unit2, comment, branch, department, active, is_capacity
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none';

export default function AssetsPage() {
  const [formData, setFormData] = useState({
    station_id: '',
    station_name: '',
    asset_id: '',
    capacity: '',
    cost: '',
    cost_money: 'TL',
    unit2: 'Adet',
    comment: '',
    branch: '',
    department: '',
    active: 1,
    is_capacity: 0,
  });

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workstations')
      .select('*')
      .order('station_id', { ascending: true });
    if (error) {
      console.error('Error loading stations:', error);
    } else {
      setStations(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'active' || name === 'is_capacity' ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      station_id: '',
      station_name: '',
      asset_id: '',
      capacity: '',
      cost: '',
      cost_money: 'TL',
      unit2: 'Adet',
      comment: '',
      branch: '',
      department: '',
      active: 1,
      is_capacity: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      station_id: Number(formData.station_id),
      active: Number(formData.active),
      is_capacity: Number(formData.is_capacity),
    };
    const { error } = await supabase.from('workstations').insert([payload]);
    if (error) {
      console.error('Insert error:', error);
      alert('Kayıt eklenirken bir hata oluştu.');
    } else {
      setShowModal(false);
      resetForm();
      loadStations();
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">İstasyon Konfigürasyonu</h1>
          <p className="mt-1 text-sm text-slate-400">
            Üretim hattındaki istasyon tanımları ve WEX eşleştirme parametreleri.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          + Yeni İstasyon Ekle
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm">
        <div className="border-b border-slate-800/80 px-6 py-4">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-300">
            Kayıtlı İstasyonlar ({stations.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-950/40 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">İstasyon Adı</th>
                <th className="px-4 py-3 font-medium">Şube</th>
                <th className="px-4 py-3 font-medium">Departman</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Henüz istasyon kaydı yok.
                  </td>
                </tr>
              ) : (
                stations.map((st) => (
                  <tr
                    key={st.station_id}
                    className="border-b border-slate-800/50 transition-colors hover:bg-slate-950/20"
                  >
                    <td className="px-4 py-3 font-mono text-slate-200">{st.station_id}</td>
                    <td className="px-4 py-3 text-slate-300">{st.station_name}</td>
                    <td className="px-4 py-3 text-slate-300">{st.branch || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{st.department || '—'}</td>
                    <td className="px-4 py-3">
                      {st.active ? (
                        <span className="inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md border border-rose-500/30 bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-300">
                          Pasif
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-emerald-400">
                Yeni İstasyon Ekle
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-slate-500">
                  Station ID
                </label>
                <input
                  type="number"
                  name="station_id"
                  value={formData.station_id}
                  onChange={handleInputChange}
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-slate-500">
                  Station Name
                </label>
                <input
                  type="text"
                  name="station_name"
                  value={formData.station_name}
                  onChange={handleInputChange}
                  required
                  className={inputClassName}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-slate-500">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-slate-500">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-slate-500">
                    Active
                  </label>
                  <select
                    name="active"
                    value={formData.active}
                    onChange={handleInputChange}
                    className={inputClassName}
                  >
                    <option value={1}>Aktif</option>
                    <option value={0}>Pasif</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-slate-500">
                    Is Capacity
                  </label>
                  <select
                    name="is_capacity"
                    value={formData.is_capacity}
                    onChange={handleInputChange}
                    className={inputClassName}
                  >
                    <option value={1}>Evet</option>
                    <option value={0}>Hayır</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
