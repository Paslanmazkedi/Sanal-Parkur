'use client';

import Link from 'next/link';

export function KpiCard({ label, value, hint, tone = 'text-white', loading = false, className = '', href }) {
  const cardClass = `rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 ${
    href ? 'transition-colors hover:border-emerald-500/35 hover:bg-slate-900' : ''
  } ${className}`;

  const body = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black tabular-nums leading-none sm:text-3xl ${loading ? 'text-slate-600' : tone}`}>
        {loading ? '—' : value}
      </p>
      {hint && <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`block ${cardClass}`}>
        {body}
      </Link>
    );
  }

  return <div className={cardClass}>{body}</div>;
}

export function SectionCard({ title, action, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/90 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function ProgressBar({ value, tone = 'bg-emerald-500' }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function HealthScore({ score }) {
  const value = Number(score) || 0;
  const tone =
    value >= 85 ? 'text-emerald-300' : value >= 60 ? 'text-amber-300' : 'text-rose-300';
  const barTone = value >= 85 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[3rem]">
        <p className={`text-lg font-black tabular-nums ${tone}`}>{value}</p>
        <p className="text-[9px] uppercase tracking-wider text-slate-600">Skor</p>
      </div>
      <div className="flex-1">
        <ProgressBar value={value} tone={barTone} />
      </div>
    </div>
  );
}

export function EmptyBlock({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 px-4 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function DetailLink({ href, label = 'Detay →' }) {
  return (
    <Link href={href} className="text-[11px] font-semibold text-slate-400 transition-colors hover:text-white">
      {label}
    </Link>
  );
}

export function PerformanceBar({ label, value, max, tone = 'bg-emerald-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-semibold text-slate-200">{value}</span>
      </div>
      <ProgressBar value={pct} tone={tone} />
    </div>
  );
}
