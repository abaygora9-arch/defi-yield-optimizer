// ============================================================
// Dashboard — Stats Overview Cards
// ============================================================

'use client';

import { Card } from '@/components/ui';
import { formatUsd, formatPct } from '@/utils';

interface StatsBarProps {
  stats: {
    totalPools: number;
    avgApy: number;
    avgRisk: number;
    trapPools: number;
    chains: string[];
  } | null;
  loading: boolean;
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-2 h-8 w-16 rounded bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Total Pools',
      value: stats.totalPools.toLocaleString(),
      icon: '📊',
    },
    {
      label: 'Avg APY',
      value: formatPct(stats.avgApy),
      icon: '📈',
    },
    {
      label: 'Avg Risk Score',
      value: `${stats.avgRisk.toFixed(1)}/100`,
      icon: '⚠️',
    },
    {
      label: 'Trap Pools',
      value: String(stats.trapPools),
      icon: '🪤',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
          <div className="mt-1 text-2xl font-bold">{item.value}</div>
        </Card>
      ))}
    </div>
  );
}
