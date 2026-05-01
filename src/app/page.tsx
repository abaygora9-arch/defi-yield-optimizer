'use client';

import { useState, useEffect, lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./DashboardClient'));

export default function Page() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0a0e1a' }}>
        <div className="text-center">
          <div style={{
            width: 40,
            height: 40,
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading DeFi data...</div>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Fetching from DefiLlama API</div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center" style={{ background: '#0a0e1a' }}>
        <div className="text-center">
          <div style={{
            width: 40,
            height: 40,
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading dashboard...</div>
        </div>
      </div>
    }>
      <Dashboard />
    </Suspense>
  );
}
