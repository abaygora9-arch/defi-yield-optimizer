// ============================================================
// Main Dashboard — Extended with Portfolio, Compare, Watchlist
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import type { DeFiPool, StrategyMode } from '@/types';
import { usePools } from '@/hooks/useData';
import { Sidebar, type Page } from '@/components/layout/Sidebar';
import { HeaderBar } from '@/components/layout/Header';
import { OverviewPage } from '@/components/pages/OverviewPage';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { StrategiesPage } from '@/components/pages/StrategiesPage';
import { ExplorerPage } from '@/components/pages/ExplorerPage';
import { SimulatorPage } from '@/components/pages/SimulatorPage';
import { PortfolioBuilder } from '@/components/pages/PortfolioPage';
import { ComparePage } from '@/components/pages/ComparePage';
import { WatchlistPage } from '@/components/pages/WatchlistPage';
import { PoolAnalyzer } from '@/components/pool/PoolAnalyzer';

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  overview: { title: 'Market Overview', subtitle: 'Real-time snapshot of DeFi yield landscape' },
  analytics: { title: 'Analytics', subtitle: 'Deep-dive charts and visualizations' },
  strategies: { title: 'Strategy Recommendations', subtitle: 'AI-ranked pools based on your risk profile' },
  explorer: { title: 'Pool Explorer', subtitle: 'Search, filter, and sort all available pools' },
  simulator: { title: 'Monte Carlo Simulator', subtitle: 'Model returns with realistic DeFi scenarios' },
  portfolio: { title: 'Portfolio Builder', subtitle: 'Multi-pool allocation with growth simulation' },
  compare: { title: 'Pool Comparison', subtitle: 'Side-by-side comparison with historical APY' },
  watchlist: { title: 'Watchlist', subtitle: 'Track your favorite pools' },
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState<Page>('overview');
  const [mode, setMode] = useState<StrategyMode>('balanced');
  const [selectedPool, setSelectedPool] = useState<DeFiPool | null>(null);

  const { data, loading, error, refresh } = usePools({ mode });

  const handleModeChange = useCallback((m: StrategyMode) => {
    setMode(m);
  }, []);

  const pageInfo = PAGE_TITLES[activePage];

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-mesh">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--blue)]/30 border-t-[var(--blue)]" />
          <div className="text-[13px] text-[var(--text-secondary)]">Loading DeFi data...</div>
          <div className="mt-1 text-[10px] text-[var(--text-muted)]">Fetching from DefiLlama API</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-mesh">
        <div className="panel p-8 text-center">
          <div className="text-2xl">⚠</div>
          <div className="mt-2 text-[13px]">{error}</div>
          <button onClick={refresh} className="mt-4 rounded-lg bg-[var(--blue)] px-4 py-2 text-[12px] text-white hover:bg-[var(--blue)]/80">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const selectedRisk = selectedPool
    ? data.risks.find((r) => r.poolId === selectedPool.id)
    : null;

  return (
    <div className="flex min-h-screen bg-mesh">
      <Sidebar active={activePage} onNavigate={setActivePage} poolCount={data.stats.totalPools} />

      <div className="ml-[200px] flex-1">
        <HeaderBar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          mode={mode}
          onModeChange={handleModeChange}
          timestamp={data.timestamp}
        />

        <main className="p-5">
          {activePage === 'overview' && (
            <OverviewPage pools={data.pools} risks={data.risks} rankings={data.rankings} stats={data.stats} onSelectPool={setSelectedPool} />
          )}
          {activePage === 'analytics' && (
            <AnalyticsPage pools={data.pools} risks={data.risks} />
          )}
          {activePage === 'strategies' && (
            <StrategiesPage pools={data.pools} risks={data.risks} rankings={data.rankings} mode={mode} onSelectPool={setSelectedPool} />
          )}
          {activePage === 'explorer' && (
            <ExplorerPage pools={data.pools} risks={data.risks} rankings={data.rankings} onSelectPool={setSelectedPool} />
          )}
          {activePage === 'simulator' && (
            <SimulatorPage pools={data.pools} risks={data.risks} mode={mode} />
          )}
          {activePage === 'portfolio' && (
            <PortfolioBuilder pools={data.pools} risks={data.risks} />
          )}
          {activePage === 'compare' && (
            <ComparePage pools={data.pools} risks={data.risks} />
          )}
          {activePage === 'watchlist' && (
            <WatchlistPage pools={data.pools} risks={data.risks} />
          )}
        </main>
      </div>

      {selectedPool && selectedRisk && (
        <PoolAnalyzer pool={selectedPool} risk={selectedRisk} mode={mode} onClose={() => setSelectedPool(null)} />
      )}
    </div>
  );
}
