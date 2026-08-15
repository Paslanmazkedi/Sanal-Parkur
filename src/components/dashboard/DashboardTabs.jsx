'use client';

import { ProductionIcon, QualityIcon, MaintenanceIcon } from './dashboardIcons';

export const TAB_CONFIG = {
  production: {
    id: 'production',
    label: 'Üretim',
    Icon: ProductionIcon,
    active: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-950/20',
    idle: 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-200',
    iconActive: 'text-emerald-400',
    iconIdle: 'text-slate-500 group-hover:text-emerald-400/80',
  },
  quality: {
    id: 'quality',
    label: 'Kalite',
    Icon: QualityIcon,
    active: 'border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-lg shadow-rose-950/20',
    idle: 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-200',
    iconActive: 'text-rose-400',
    iconIdle: 'text-slate-500 group-hover:text-rose-400/80',
  },
  maintenance: {
    id: 'maintenance',
    label: 'Bakım',
    Icon: MaintenanceIcon,
    active: 'border-sky-500/50 bg-sky-500/15 text-sky-300 shadow-lg shadow-sky-950/20',
    idle: 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-200',
    iconActive: 'text-sky-400',
    iconIdle: 'text-slate-500 group-hover:text-sky-400/80',
  },
};

const TAB_ORDER = ['production', 'quality', 'maintenance'];

export default function DashboardTabs({ activeTab, onChange }) {
  return (
    <nav aria-label="Dashboard sekmeleri" className="grid grid-cols-3 gap-2 sm:gap-3">
      {TAB_ORDER.map((tabId) => {
        const tab = TAB_CONFIG[tabId];
        const isActive = activeTab === tabId;
        const Icon = tab.Icon;

        return (
          <button
            key={tabId}
            type="button"
            onClick={() => onChange(tabId)}
            className={`group flex flex-col items-center gap-2 rounded-xl border px-3 py-3 transition-all sm:flex-row sm:justify-center sm:px-4 sm:py-3.5 ${
              isActive ? tab.active : tab.idle
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${isActive ? tab.iconActive : tab.iconIdle}`} />
            <span className="text-xs font-bold tracking-wide sm:text-sm">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
