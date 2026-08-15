export const STAGE_META = {
  4: { label: 'Bekliyor', tone: 'sky', className: 'bg-sky-500/15 text-sky-300 border-sky-500/30', barClass: 'bg-sky-400', fill: '#38bdf8' },
  0: { label: 'Operatörde', tone: 'amber', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30', barClass: 'bg-amber-400', fill: '#fbbf24' },
  1: { label: 'Üretimde', tone: 'emerald', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', barClass: 'bg-emerald-400', fill: '#34d399' },
  3: { label: 'Arıza / Durdu', tone: 'rose', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30', barClass: 'bg-rose-400', fill: '#fb7185' },
  2: { label: 'Tamamlandı', tone: 'slate', className: 'bg-slate-500/15 text-slate-300 border-slate-500/30', barClass: 'bg-slate-400', fill: '#94a3b8' },
};

/** Üretim akış sırası — grafik ve özetlerde aynı dizi kullanılır */
export const STAGE_CHART_ORDER = [4, 0, 1, 3, 2];

export function getStageMeta(stage) {
  return STAGE_META[Number(stage)] ?? STAGE_META[4];
}

export function isActiveStage(stage) {
  return [0, 1].includes(Number(stage));
}

export function isQueueStage(stage) {
  return Number(stage) === 4;
}
