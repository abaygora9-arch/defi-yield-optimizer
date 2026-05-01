'use client';

export default function PageLoader() {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#0a0e1a',
      color: '#fff',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>DeFi Yield Optimizer</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading...</p>
        <p style={{ color: '#475569', fontSize: 11, marginTop: 16 }}>
          Client rendering: {typeof window !== 'undefined' ? '✓' : '✗'}
        </p>
      </div>
    </div>
  );
}
