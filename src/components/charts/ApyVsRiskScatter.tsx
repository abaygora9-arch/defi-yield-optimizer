// ============================================================
// Charts — APY vs Risk Scatter Plot
// ============================================================

'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DeFiPool, RiskAssessment } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { RISK_COLORS, CHAIN_LABELS } from '@/utils';

interface ApyVsRiskScatterProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  onSelect: (pool: DeFiPool) => void;
}

export function ApyVsRiskScatter({
  pools,
  risks,
  onSelect,
}: ApyVsRiskScatterProps) {
  const riskMap = useMemo(
    () => new Map(risks.map((r) => [r.poolId, r])),
    [risks]
  );

  const data = useMemo(
    () =>
      pools
        .filter((p) => riskMap.has(p.id))
        .map((p) => ({
          risk: riskMap.get(p.id)!.score,
          apy: Math.min(p.apy, 200), // Cap for display
          tvl: p.tvlUsd,
          name: p.symbol,
          protocol: p.protocol,
          chain: p.chain,
          pool: p,
        })),
    [pools, riskMap]
  );

  const getColor = (risk: number): string => {
    if (risk < 20) return RISK_COLORS['Very Low'];
    if (risk < 40) return RISK_COLORS['Low'];
    if (risk < 60) return RISK_COLORS['Medium'];
    if (risk < 80) return RISK_COLORS['High'];
    return RISK_COLORS['Very High'];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>APY vs Risk Score</CardTitle>
      </CardHeader>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="risk"
              name="Risk Score"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{
                value: 'Risk Score',
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: 12 },
              }}
            />
            <YAxis
              dataKey="apy"
              name="APY %"
              tick={{ fontSize: 12 }}
              label={{
                value: 'APY %',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.protocol} · {CHAIN_LABELS[d.chain]}
                    </div>
                    <div className="mt-1 text-sm">
                      APY: <span className="font-mono text-green-500">{d.apy.toFixed(2)}%</span>
                    </div>
                    <div className="text-sm">
                      Risk: <span className="font-mono">{d.risk}</span>
                    </div>
                    <div className="text-sm">
                      TVL: <span className="font-mono">${(d.tvl / 1e6).toFixed(2)}M</span>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={data}
              onClick={(entry) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = (entry as any)?.pool as DeFiPool | undefined;
                if (p) onSelect(p);
              }}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={getColor(entry.risk)}
                  fillOpacity={0.7}
                  r={Math.max(3, Math.min(10, Math.log10(entry.tvl + 1) * 1.5))}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
