'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-mesh">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--blue)]/30 border-t-[var(--blue)]" />
          <div className="text-[13px] text-[var(--text-secondary)]">Loading DeFi data...</div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

// Lazy load the heavy dashboard component
import dynamic from 'next/dynamic';
const Dashboard = dynamic(() => import('./DashboardClient'), { ssr: false });
