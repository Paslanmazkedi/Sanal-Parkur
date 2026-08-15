'use client';

import { useState } from 'react';
import { supabase } from '../../supabase';

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-white focus:border-emerald-500 focus:outline-none';

const EMPTY_FORM = {
  station_id: '',
  station_name: '',
  branch: '',
  department: '',
  active: 1,
  is_capacity: 0,
};

export default function AddStationModal({ open, onClose, onCreated }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'active' || name === 'is_capacity' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...formData,
      station_id: Number(formData.station_id),
      active: Number(formData.active),
      is_capacity: Number(formData.is_capacity),
    };

    const { error: insertError } = await supabase.from('workstations').insert([payload]);
    setSaving(false);

    if (insertError) {
      setError(insertError.message || 'Kayıt eklenirken bir hata oluştu.');
      return;
    }

    setFormData(EMPTY_FORM);
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-emerald-400">
            Yeni İstasyon Ekle
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 transition-colors hover:text-white">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          ) : null}
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
              İstasyon adı
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
                Şube
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
                Departman
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
                Durum
              </label>
              <select name="active" value={formData.active} onChange={handleInputChange} className={inputClassName}>
                <option value={1}>Aktif</option>
                <option value={0}>Pasif</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-slate-500">
                Kapasite
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
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
