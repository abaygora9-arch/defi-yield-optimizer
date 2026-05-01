// ============================================================
// Charts — Pool Comparison Radar Chart
// ============================================================

'use client';

import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { DeFiPool, RiskAssessment } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui';

interface PoolRadarChartProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  selectedIds?: string[];
}

const RADAR_AXES = [
  { key: 'apy', label: 'APY', max: 100 },
  { key: 'tvl', label: 'TVL', max: 1 },
  { key: 'stability', label: 'Stability', max: 1 },
  { key: 'safety', label: 'Safety', max: 1 },
  { key: 'liquidity', label: 'Liquidity', max: 1 },
];

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PoolRadarChart({
  pools,
  risks,
  selectedIds,
}: PoolRadarChartProps) {
  const riskMap = useMemo(
    () => new Map(risks.map((r) => [r.poolId, r])),
    [risks]
  );

  const displayPools = useMemo(() => {
    if (selectedIds && selectedIds.length > 0) {
      return pools.filter((p) => selectedIds.includes(p.id)).slice(0, 5);
    }
    // Show top 3 by APY
    return [...pools].sort((a, b) => b.apy - a.apy).slice(0, 3);
  }, [pools, selectedIds]);

  const data = useMemo(() => {
    return RADAR_AXES.map((axis) => {
      const point: Record<string, string | number> = { axis: axis.label };

      displayPools.forEach((pool) => {
        const risk = riskMap.get(pool.id);
        let value: number;

        switch (axis.key) {
          case 'apy':
            value = Math.min(pool.apy / axis.max, 1);
            break;
          case 'tvl':
            value = Math.min(Math.log10(pool.tvlUsd + 1) / 10, 1);
            break;
          case 'stability':
            value = pool.stabilityIndicator;
            break;
          case 'safety':
            value = risk ? 1 - risk.score / 100 : 0.5;
            break;
          case 'liquidity':
            value = 1 - pool.liquidityDepthScore;
            break;
          default:
            value = 0;
        }

        point[pool.symbol] = Math.round(value * 100);
      });

      return point;
    });
  }, [displayPools, riskMap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool Comparison Radar</CardTitle>
      </CardHeader>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
            />
            {displayPools.map((pool, i) => (
              <Radar
                key={pool.id}
                name={pool.symbol}
                dataKey={pool.symbol}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                return (
                  <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                    {payload.map((p, i) => (
                      <div key={i} className="text-sm">
                        <span style={{ color: p.color }}>{p.name}</span>:{' '}
                        <span className="font-mono">{p.value}%</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
