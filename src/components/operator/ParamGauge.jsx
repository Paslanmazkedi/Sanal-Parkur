'use client';

function needlePoint(cx, cy, radius, ratio) {
  const angle = Math.PI * (1 - Math.min(1, Math.max(0, ratio)));
  return {
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  };
}

export default function ParamGauge({ label, value, display, min = 0, max = 100 }) {
  const numeric = Number(value);
  const hasValue = value != null && value !== '' && Number.isFinite(numeric);
  const span = max - min || 1;
  const ratio = hasValue ? Math.min(1, Math.max(0, (numeric - min) / span)) : 0;
  const cx = 50;
  const cy = 46;
  const radius = 34;
  const tip = needlePoint(cx, cy, radius - 4, ratio);

  return (
    <div className="flex flex-col rounded-xl border border-slate-800/90 bg-slate-900/70 px-2 py-2">
      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <svg viewBox="0 0 100 58" className="mt-0.5 h-[3.25rem] w-full" aria-hidden>
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#22c55e"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${ratio * Math.PI * radius} ${Math.PI * radius}`}
        />
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3.2" fill="#f8fafc" />
        <text x={cx - radius} y="56" textAnchor="middle" fill="#64748b" fontSize="7">
          {min}
        </text>
        <text x={cx + radius} y="56" textAnchor="middle" fill="#64748b" fontSize="7">
          {max}
        </text>
      </svg>
      <p className="text-center font-mono text-sm font-bold tabular-nums text-white">{hasValue ? display : '—'}</p>
    </div>
  );
}
