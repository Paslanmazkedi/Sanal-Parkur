'use client';

import { OPERATOR_ACTIONS, getActionDisabledReason } from '@/lib/operatorConstants';

const actionStyles = {
  control: 'border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20',
  start: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20',
  pause: 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20',
  finish: 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
};

export default function OperatorActionBar({
  selectedOrder,
  busy,
  onAction,
  onOpenTimeEntry,
}) {
  const currentStage = selectedOrder ? Number(selectedOrder.is_stage) : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-300">Islem Paneli</h2>
        {!selectedOrder && (
          <span className="text-xs text-amber-400">Kuyruktan veya aktif listeden emir secin</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(OPERATOR_ACTIONS).map(([action, config]) => {
          if (action === 'finish') {
            const disabledReason = getActionDisabledReason(action, currentStage, Boolean(selectedOrder));
            return (
              <button
                key={action}
                type="button"
                disabled={Boolean(disabledReason) || busy}
                title={disabledReason || config.label}
                onClick={() => onAction('finish')}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${actionStyles.finish}`}
              >
                {config.label}
              </button>
            );
          }

          const disabledReason = getActionDisabledReason(action, currentStage, Boolean(selectedOrder));
          return (
            <button
              key={action}
              type="button"
              disabled={Boolean(disabledReason) || busy}
              title={disabledReason || config.label}
              onClick={() => onAction(action)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${actionStyles[action]}`}
            >
              {config.label}
            </button>
          );
        })}

        <button
          type="button"
          disabled={!selectedOrder || busy}
          onClick={onOpenTimeEntry}
          className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Zaman Harcamasi
        </button>
      </div>
    </div>
  );
}
