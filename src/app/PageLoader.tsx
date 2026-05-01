'use client';

import { useState, useEffect } from 'react';
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

// Error boundary
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex h-screen items-center justify-center bg-mesh">
      <div className="text-center max-w-lg p-8">
        <div className="text-2xl mb-4">⚠</div>
        <div className="text-[15px] font-semibold mb-2">Something went wrong</div>
        <pre className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-primary)] p-4 rounded-lg overflow-auto text-left max-h-[300px]">
          {error?.message}
          {'\n\n'}
          {error?.stack}
        </pre>
      </div>
    </div>
  );
}

export default function PageLoader() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setError(event.error || new Error(event.message));
      event.preventDefault();
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', (e) => {
      setError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)));
      e.preventDefault();
    });
    return () => {
      window.removeEventListener('error', handler);
    };
  }, []);

  if (error) return <ErrorFallback error={error} />;

  return <Dashboard />;
}
