'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-mesh">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--blue)]/30 border-t-[var(--blue)]" />
        <div className="text-[13px] text-[var(--text-secondary)]">Loading DeFi data...</div>
        <div className="mt-1 text-[10px] text-[var(--text-muted)]">Fetching from DefiLlama API</div>
      </div>
    </div>
  ),
});

export default function PageLoader() {
  return <Dashboard />;
}
