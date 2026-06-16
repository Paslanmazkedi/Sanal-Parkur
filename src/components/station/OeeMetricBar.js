export default function OeeMetricBar({ label, value, tone = 'emerald' }) {
  const barClass =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'rose'
          ? 'bg-rose-500'
          : 'bg-sky-500';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
        <span>{label}</span>
        <span className="text-slate-300">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
