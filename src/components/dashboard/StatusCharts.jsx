'use client';

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { STAGE_CHART_ORDER, STAGE_META } from '@/lib/stationStages';

export function MiniDonut({ value = 0, total = 0, color = '#34d399' }) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const r = 14;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 shrink-0" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-200">{item.label}</p>
      <p className="mt-0.5 font-mono tabular-nums text-slate-400">
        {Number(item.count || 0).toLocaleString('tr-TR')} emir
      </p>
    </div>
  );
}

export function StatusBarChart({ items = [], loading = false }) {
  const rows = (items.length
    ? items
    : STAGE_CHART_ORDER.map((stage) => ({
        stage,
        label: STAGE_META[stage].label,
        chartLabel: STAGE_META[stage].chartLabel,
        count: 0,
      }))
  ).map((item) => ({
    ...item,
    label: item.label || STAGE_META[item.stage]?.label,
    chartLabel: item.chartLabel || STAGE_META[item.stage]?.chartLabel || STAGE_META[item.stage]?.label,
    fill: STAGE_META[item.stage]?.fill || '#64748b',
    count: Number(item.count) || 0,
  }));
  const total = rows.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Emir statüleri</p>
          <p className="mt-0.5 text-xs text-slate-400">Workcube emirleri · saha statüsü</p>
        </div>
        <p className="font-mono text-xs tabular-nums text-slate-500">
          {loading ? '—' : `${total.toLocaleString('tr-TR')} emir`}
        </p>
      </div>

      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 28, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="chartLabel"
              interval={0}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} content={<ChartTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={52} isAnimationActive={!loading}>
              {rows.map((item) => (
                <Cell key={item.stage} fill={item.fill} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                formatter={(value) => Number(value || 0).toLocaleString('tr-TR')}
                fill="#e2e8f0"
                fontSize={12}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
