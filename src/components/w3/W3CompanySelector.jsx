'use client';

const STORAGE_KEY = 'sanal_parkur_wex_company_id';

export function readStoredCompanyId(fallback = 1) {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const parsed = Number(stored);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function writeStoredCompanyId(companyId) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, String(companyId));
}

export default function W3CompanySelector({ value, options, onChange, disabled = false }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Şirket</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 min-w-[9rem] rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-emerald-500"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
