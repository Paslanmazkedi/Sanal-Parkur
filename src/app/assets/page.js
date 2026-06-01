// This page manages Workstations (stations) in the Workcube ERP schema.
// Columns: station_id (PK), station_name, asset_id, capacity, cost, cost_money, unit2, comment, branch, department, active, is_capacity
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AssetsPage() {
  // Form state
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

  // Data & UI state
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load stations on mount
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
      loadStations();
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">İstasyonlar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Yeni İstasyon Ekle +
        </button>
      </div>

      {/* Stations Table */}
<div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
<table className="min-w-full bg-slate-900/40 border border-gray-200">
<thead className="bg-slate-800/50">
            <tr>
<th className="px-4 py-2 text-left text-slate-200 font-semibold bg-slate-800/50">ID</th>
<th className="px-4 py-2 text-left text-slate-200 font-semibold bg-slate-800/50">İsim</th>
<th className="px-4 py-2 text-left text-slate-200 font-semibold bg-slate-800/50">Branch</th>
<th className="px-4 py-2 text-left text-slate-200 font-semibold bg-slate-800/50">Department</th>
<th className="px-4 py-2 text-left text-slate-200 font-semibold bg-slate-800/50">Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center">
                  Yükleniyor...
                </td>
              </tr>
            ) : (
              stations.map((st) => (
                <tr key={st.station_id} className="border-t">
<td className="px-4 py-2 text-slate-300">{st.station_id}</td>
<td className="px-4 py-2 text-slate-300">{st.station_name}</td>
<td className="px-4 py-2 text-slate-300">{st.branch}</td>
<td className="px-4 py-2 text-slate-300">{st.department}</td>
<td className="px-4 py-2">
  {st.active ? (
    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs">Aktif</span>
  ) : (
    <span className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded text-xs">Pasif</span>
  )}
</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Yeni İstasyon Ekle</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Station ID</label>
                <input
                  type="number"
                  name="station_id"
                  value={formData.station_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Station Name</label>
                <input
                  type="text"
                  name="station_name"
                  value={formData.station_name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Branch</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">Active (1/0)</label>
                  <select
                    name="active"
                    value={formData.active}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded p-2"
                  >
                    <option value={1}>1 (Aktif)</option>
                    <option value={0}>0 (Pasif)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium">Is Capacity (1/0)</label>
                  <select
                    name="is_capacity"
                    value={formData.is_capacity}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border rounded p-2"
                  >
                    <option value={1}>1</option>
                    <option value={0}>0</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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