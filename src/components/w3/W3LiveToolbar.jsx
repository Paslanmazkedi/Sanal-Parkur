'use client';

const STAGE_CLASS = {
  4: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  0: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  1: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  3: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  2: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

export function W3StageBadge({ stage, label }) {
  const stageNumber = Number(stage);
  const className = STAGE_CLASS[stageNumber] || STAGE_CLASS[4];

  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      {label || `Stage ${stageNumber}`}
    </span>
  );
}

export default function W3LiveToolbar({
  companyId,
  companyOptions,
  onCompanyChange,
  onRefresh,
  loading,
  fetchedAt,
  count,
  meta,
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Şirket</span>
            <select
              value={companyId}
              disabled={loading}
              onChange={(event) => onCompanyChange(Number(event.target.value))}
              className="h-10 min-w-[9rem] rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-emerald-500"
            >
              {companyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Çekiliyor...' : 'Workcube’dan Yenile'}
          </button>
        </div>

        <div className="min-w-0 text-xs text-slate-500">
          <p>
            <span className="font-semibold text-slate-300">{count ?? '—'}</span> kayıt
            {fetchedAt ? (
              <>
                {' '}
                · Son çekim:{' '}
                <span className="font-mono text-slate-400">
                  {new Date(fetchedAt).toLocaleString('tr-TR')}
                </span>
              </>
            ) : null}
          </p>
          {meta ? <p className="mt-1 truncate font-mono text-[11px] text-slate-600">{meta}</p> : null}
        </div>
      </div>
    </div>
  );
}
