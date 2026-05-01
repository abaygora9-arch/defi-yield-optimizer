// ============================================================
// Analytics Page — Full Charts Dashboard
// ============================================================

'use client';

import { useMemo, useState } from 'react';
import type { DeFiPool, RiskAssessment, Chain } from '@/types';
import { Card } from '@/components/ui';
import { PoolHeatmap } from '@/components/charts/PoolHeatmap';
import { formatUsd, formatPct, CHAIN_LABELS, CHAIN_COLORS, RISK_COLORS } from '@/utils';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, BarChart, Bar, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  PieChart, Pie,
} from 'recharts';

interface AnalyticsPageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
}

export function AnalyticsPage({ pools, risks }: AnalyticsPageProps) {
  const [hoveredPool, setHoveredPool] = useState<string | null>(null);
  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);

  // Scatter data
  const scatterData = useMemo(
    () =>
      pools
        .filter((p) => riskMap.has(p.id))
        .map((p) => ({
          risk: riskMap.get(p.id)!.score,
          apy: Math.min(p.apy, 200),
          tvl: p.tvlUsd,
          name: p.symbol,
          protocol: p.protocol,
          chain: p.chain,
          pool: p,
        })),
    [pools, riskMap]
  );

  // APY distribution by chain
  const apyByChain = useMemo(() => {
    const data: Record<string, { chain: string; avg: number; max: number; count: number; color: string }> = {};
    pools.forEach((p) => {
      if (!data[p.chain]) data[p.chain] = { chain: CHAIN_LABELS[p.chain], avg: 0, max: 0, count: 0, color: CHAIN_COLORS[p.chain] };
      data[p.chain].avg += p.apy;
      data[p.chain].max = Math.max(data[p.chain].max, p.apy);
      data[p.chain].count++;
    });
    return Object.values(data).map((d) => ({
      ...d,
      avg: Math.round((d.avg / d.count) * 100) / 100,
      max: Math.round(d.max * 100) / 100,
    }));
  }, [pools]);

  // Top 5 for radar
  const radarPools = useMemo(
    () => [...pools].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 5),
    [pools]
  );

  const radarData = useMemo(() => {
    const axes = ['APY', 'TVL', 'Stability', 'Safety', 'Liquidity'];
    return axes.map((axis) => {
      const point: Record<string, string | number> = { axis };
      radarPools.forEach((pool) => {
        const risk = riskMap.get(pool.id);
        let value = 0;
        switch (axis) {
          case 'APY': value = Math.min(pool.apy / 100, 1); break;
          case 'TVL': value = Math.min(Math.log10(pool.tvlUsd + 1) / 10, 1); break;
          case 'Stability': value = pool.stabilityIndicator; break;
          case 'Safety': value = risk ? 1 - risk.score / 100 : 0.5; break;
          case 'Liquidity': value = 1 - pool.liquidityDepthScore; break;
        }
        point[pool.symbol] = Math.round(value * 100);
      });
      return point;
    });
  }, [radarPools, riskMap]);

  const RADAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Risk histogram
  const histogramData = useMemo(() => {
    const buckets = [
      { range: '0-10', min: 0, max: 10, count: 0 },
      { range: '10-20', min: 10, max: 20, count: 0 },
      { range: '20-30', min: 20, max: 30, count: 0 },
      { range: '30-40', min: 30, max: 40, count: 0 },
      { range: '40-50', min: 40, max: 50, count: 0 },
      { range: '50-60', min: 50, max: 60, count: 0 },
      { range: '60-70', min: 60, max: 70, count: 0 },
      { range: '70-80', min: 70, max: 80, count: 0 },
      { range: '80-90', min: 80, max: 90, count: 0 },
      { range: '90-100', min: 90, max: 100, count: 0 },
    ];
    risks.forEach((r) => {
      const b = buckets.find((b) => r.score >= b.min && r.score < b.max);
      if (b) b.count++;
      else if (r.score === 100) buckets[9].count++;
    });
    return buckets;
  }, [risks]);

  const getRiskColor = (score: number) => {
    if (score < 20) return RISK_COLORS['Very Low'];
    if (score < 40) return RISK_COLORS['Low'];
    if (score < 60) return RISK_COLORS['Medium'];
    if (score < 80) return RISK_COLORS['High'];
    return RISK_COLORS['Very High'];
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main scatter */}
      <Card className="glass glow-blue p-0 overflow-hidden">
        <div className="border-b border-[var(--glass-border)] px-5 py-3">
          <div className="text-sm font-semibold">APY vs Risk Score</div>
          <div className="text-[10px] text-[var(--muted-foreground)]">Bubble size = TVL · Color = Risk category</div>
        </div>
        <div className="h-[380px] px-2 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="risk" name="Risk" domain={[0, 100]} tick={{ fontSize: 11 }}
                label={{ value: 'Risk Score', position: 'insideBottom', offset: -8, style: { fontSize: 11, fill: '#64748b' } }} />
              <YAxis dataKey="apy" name="APY" tick={{ fontSize: 11 }}
                label={{ value: 'APY %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="glass rounded-xl px-4 py-3 shadow-xl">
                      <div className="text-sm font-bold">{d.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{d.protocol} · {CHAIN_LABELS[d.chain]}</div>
                      <div className="mt-2 space-y-0.5 text-xs">
                        <div>APY: <span className="font-mono text-[var(--success)]">{d.apy.toFixed(2)}%</span></div>
                        <div>Risk: <span className="font-mono">{d.risk}</span></div>
                        <div>TVL: <span className="font-mono">{formatUsd(d.tvl)}</span></div>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData}>
                {scatterData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={getRiskColor(entry.risk)}
                    fillOpacity={0.7}
                    r={Math.max(3, Math.min(12, Math.log10(entry.tvl + 1) * 1.5))}
                    stroke={getRiskColor(entry.risk)}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pool Heatmap */}
      <PoolHeatmap pools={pools} risks={risks} />

      {/* Grid of smaller charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk Histogram */}
        <Card className="glass glow-purple">
          <div className="mb-3 text-sm font-semibold">Risk Distribution</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  return <div className="glass rounded-lg px-3 py-2 text-xs">{payload[0].payload.range}: {payload[0].value} pools</div>;
                }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {histogramData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${220 + i * 15}, 70%, ${50 + i * 3}%)`} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* APY by Chain */}
        <Card className="glass glow-green">
          <div className="mb-3 text-sm font-semibold">APY by Chain</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apyByChain} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="chain" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return <div className="glass rounded-lg px-3 py-2 text-xs">{d.chain}: avg {d.avg}% · max {d.max}%</div>;
                }} />
                <Bar dataKey="avg" name="Avg APY" radius={[4, 4, 0, 0]}>
                  {apyByChain.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Radar */}
        <Card className="glass glow-orange">
          <div className="mb-3 text-sm font-semibold">Top 5 Pool Comparison</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(148,163,184,0.15)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                {radarPools.map((pool, i) => (
                  <Radar key={pool.id} name={pool.symbol} dataKey={pool.symbol}
                    stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.1} strokeWidth={1.5} />
                ))}
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  return (
                    <div className="glass rounded-lg px-3 py-2 text-xs">
                      {payload.map((p, i) => (
                        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}%</div>
                      ))}
                    </div>
                  );
                }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {radarPools.map((p, i) => (
              <span key={p.id} className="text-[10px]" style={{ color: RADAR_COLORS[i] }}>{p.symbol}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
