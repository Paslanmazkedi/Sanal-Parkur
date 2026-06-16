'use client';

export default function StationSelectorBar({ workstations, stationId, onStationChange }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">İstasyon Seçimi</p>
          <p className="mt-1 text-sm text-slate-400">Çalışacağınız hattı yukarıdan seçin; işlem paneli buna göre güncellenir.</p>
        </div>
        <div className="w-full sm:max-w-sm">
          <label htmlFor="station-select" className="mb-1.5 block text-[10px] font-mono uppercase tracking-wider text-slate-500">
            İstasyon
          </label>
          <select
            id="station-select"
            value={stationId}
            onChange={(e) => onStationChange(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">İstasyon seçin</option>
            {workstations.map((ws) => (
              <option key={ws.station_id} value={ws.station_id}>
                {ws.station_name} (#{ws.station_id})
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
