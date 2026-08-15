'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import ProductionTab from '@/components/dashboard/tabs/ProductionTab';
import QualityTab from '@/components/dashboard/tabs/QualityTab';
import MaintenanceTab from '@/components/dashboard/tabs/MaintenanceTab';
import { readStoredCompanyId } from '@/components/w3/W3CompanySelector';
import { loadDashboardSnapshot } from '@/lib/dashboardMetrics';
import { fetchWorkcubeDashboard } from '@/lib/workcubeDashboard';
import { supabase } from '../supabase';

function PageClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right font-mono">
      <p className="text-xs text-slate-500">
        {now.toLocaleDateString('tr-TR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-300">
        {now.toLocaleTimeString('tr-TR', { hour12: false })}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('production');
  const [snapshot, setSnapshot] = useState(null);
  const [workcube, setWorkcube] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [workcubeLoading, setWorkcubeLoading] = useState(true);
  const [workcubeError, setWorkcubeError] = useState('');

  const refreshLocal = useCallback(async () => {
    const data = await loadDashboardSnapshot(supabase);
    setSnapshot(data);
    setLocalLoading(false);
  }, []);

  const refreshWorkcube = useCallback(async () => {
    setWorkcubeLoading(true);
    setWorkcubeError('');

    try {
      const companyId = readStoredCompanyId(1);
      const data = await fetchWorkcubeDashboard(companyId);
      setWorkcube(data);
    } catch (err) {
      setWorkcubeError(err.message || 'Workcube verisi alınamadı.');
      setWorkcube(null);
    } finally {
      setWorkcubeLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshLocal(), refreshWorkcube()]);
  }, [refreshLocal, refreshWorkcube]);

  useEffect(() => {
    refreshAll();
    const timer = setInterval(refreshAll, 60000);
    return () => clearInterval(timer);
  }, [refreshAll]);

  const loading = localLoading || workcubeLoading;

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 pb-4">
      <header className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />
        <PageClock />
      </header>

      {snapshot?.errors?.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          Yerel veri uyarısı: {snapshot.errors.join(' · ')}
        </div>
      )}

      <div className="min-h-[24rem]">
        {activeTab === 'production' && (
          <ProductionTab
            workcube={workcube}
            snapshot={snapshot}
            loading={localLoading}
            orderLoading={workcubeLoading}
            error={workcubeError}
            fetchedAt={workcube?.fetchedAt}
          />
        )}
        {activeTab === 'quality' && <QualityTab snapshot={snapshot} loading={localLoading} />}
        {activeTab === 'maintenance' && (
          <MaintenanceTab workcube={workcube} snapshot={snapshot} loading={loading} />
        )}
      </div>
    </div>
  );
}
