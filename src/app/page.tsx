'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('./DashboardClient'), { ssr: false });

export default function Page() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-mesh">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          <div className="text-sm text-slate-400">Loading DeFi data...</div>
          <div className="text-xs text-slate-600 mt-1">Fetching from DefiLlama API</div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
