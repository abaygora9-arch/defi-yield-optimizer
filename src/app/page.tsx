'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  const [Dashboard, setDashboard] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('./DashboardClient').then((mod) => {
      setDashboard(() => mod.default);
    }).catch((err) => {
      console.error('Failed to load dashboard:', err);
    });
  }, []);

  if (!Dashboard) {
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
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
