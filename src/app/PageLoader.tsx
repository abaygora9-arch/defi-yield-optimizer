'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('./DashboardClient'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#0a0e1a',
      color: '#94a3b8',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <div style={{ fontSize: 13 }}>Loading DeFi data...</div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Fetching from DefiLlama API</div>
      </div>
    </div>
  ),
});

export default function PageLoader() {
  return <Dashboard />;
}
