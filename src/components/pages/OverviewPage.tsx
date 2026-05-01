// ============================================================
// Overview Page — Market Snapshot (Redesigned)
// ============================================================

'use client';

import { useMemo } from 'react';
import type { DeFiPool, RiskAssessment, StrategyRanking } from '@/types';
import { formatUsd, formatPct, CHAIN_LABELS, CHAIN_COLORS, RISK_COLORS } from '@/utils';
import {
  BarChart, Bar, Cell, PieChart, Pie,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

interface OverviewPageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  rankings: StrategyRanking[];
  stats: {
    totalPools: number;
    avgApy: number;
    avgRisk: number;
    trapPools: number;
    chains: string[];
    chainBreakdown?: Record<string, number>;
  };
  onSelectPool?: (pool: DeFiPool) => void;
  onOpenPool?: (pool: DeFiPool) => void;
}

export function OverviewPage({ pools, risks, rankings, stats, onSelectPool }: OverviewPageProps) {
  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);

  // Chain distribution — from ALL pools in stats, not just top 50
  const chainData = useMemo(() => {
    const breakdown = stats.chainBreakdown || {};
    return Object.entries(breakdown)
      .map(([chain, count]) => ({
        chain: CHAIN_LABELS[chain] || chain,
        count,
        color: CHAIN_COLORS[chain] || '#64748b',
        key: chain,
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats.chainBreakdown]);

  // Top APY per chain
  const topPerChain = useMemo(() => {
    const best: Record<string, DeFiPool> = {};
    pools.forEach((p) => {
      if (!best[p.chain] || p.apy > best[p.chain].apy) {
        best[p.chain] = p;
      }
    });
    return Object.entries(best).map(([chain, pool]) => ({
      chain: CHAIN_LABELS[chain],
      color: CHAIN_COLORS[chain],
      symbol: pool.symbol,
      protocol: pool.protocol,
      apy: pool.apy,
      tvl: pool.tvlUsd,
      pool,
    }));
  }, [pools]);

  // Safest pools
  const safest = useMemo(() => {
    return [...pools]
      .filter((p) => riskMap.has(p.id))
      .sort((a, b) => (riskMap.get(a.id)!.score) - (riskMap.get(b.id)!.score))
      .slice(0, 5);
  }, [pools, riskMap]);

  // Highest APY
  const topApy = useMemo(
    () => [...pools].sort((a, b) => b.apy - a.apy).slice(0, 5),
    [pools]
  );

  // Risk distribution
  const riskDist = useMemo(() => {
    const cats: Record<string, number> = { 'Very Low': 0, 'Low': 0, 'Medium': 0, 'High': 0, 'Very High': 0 };
    risks.forEach((r) => { cats[r.category]++; });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value, color: RISK_COLORS[name] }))
      .filter((d) => d.value > 0);
  }, [risks]);

  // TVL by chain
  const tvlByChain = useMemo(() => {
    const tvls: Record<string, number> = {};
    pools.forEach((p) => { tvls[p.chain] = (tvls[p.chain] || 0) + p.tvlUsd; });
    return Object.entries(tvls)
      .map(([chain, tvl]) => ({
        chain: CHAIN_LABELS[chain] || chain,
        tvl: Math.round(tvl / 1e9 * 100) / 100,
        color: CHAIN_COLORS[chain] || '#64748b',
      }))
      .sort((a, b) => b.tvl - a.tvl);
  }, [pools]);

  return (
    <div className="space-y-5 animate-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Pools" value={stats.totalPools.toLocaleString()} color="blue" />
        <StatCard label="Avg APY" value={formatPct(stats.avgApy)} color="green" />
        <StatCard label="Risk Score" value={`${stats.avgRisk.toFixed(1)}`} color="amber" />
        <StatCard label="Trap Pools" value={String(stats.trapPools)} color="red" />
        <StatCard label="Chains" value={String(stats.chains.length)} color="purple" />
      </div>

      {/* Chain Breakdown — PROMINENT */}
      <div className="panel p-0 overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold">Chain Distribution</div>
            <div className="text-[10px] text-[var(--text-muted)]">Pool count across all supported chains</div>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">{stats.totalPools.toLocaleString()} total</div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {chainData.map((c) => (
              <div key={c.key} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-[var(--border)] p-3">
                <div className="h-10 w-1 rounded-full" style={{ background: c.color }} />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: c.color }}>{c.chain}</div>
                  <div className="text-[18px] font-bold">{c.count.toLocaleString()}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">
                    {((c.count / stats.totalPools) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk Distribution */}
        <div className="panel p-4">
          <div className="mb-3 text-[12px] font-semibold text-[var(--text-secondary)]">Risk Distribution</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDist} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#f1f5f9' }}
formatter={(v) => [`${v} pools`, `Count`]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TVL by Chain */}
        <div className="panel p-4">
          <div className="mb-3 text-[12px] font-semibold text-[var(--text-secondary)]">TVL by Chain</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tvlByChain} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}B`} />
                <YAxis type="category" dataKey="chain" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip
                  contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
formatter={(v) => [`$${v}B`, `TVL`]}
                />
                <Bar dataKey="tvl" radius={[0, 4, 4, 0]}>
                  {tvlByChain.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.65} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chain Pie */}
        <div className="panel p-4">
          <div className="mb-3 text-[12px] font-semibold text-[var(--text-secondary)]">Pool Share</div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chainData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {chainData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v, name, entry: any) => [`${v} pools`, entry?.payload?.chain || name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            {chainData.map((c) => (
              <div key={c.key} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                {c.chain}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Per Chain + Best/Safest */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Best APY per Chain */}
        <div className="panel p-0 overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-2.5">
            <div className="text-[12px] font-semibold">Best APY per Chain</div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {topPerChain.map((item) => (
              <div
                key={item.chain}
                onClick={() => onSelectPool?.(item.pool)}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  <div>
                    <div className="text-[12px] font-medium">{item.symbol}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{item.protocol} · {item.chain}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-[var(--green)]">{formatPct(item.apy)}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">{formatUsd(item.tvl)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highest APY */}
        <div className="panel p-0 overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-2.5">
            <div className="text-[12px] font-semibold">🔥 Highest APY</div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {topApy.map((pool, i) => (
              <div
                key={pool.id}
                onClick={() => onSelectPool?.(pool)}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold bg-[var(--green-dim)] text-[var(--green)]">{i + 1}</span>
                  <div>
                    <div className="text-[12px] font-medium">{pool.symbol}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{pool.protocol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-[var(--green)]">{formatPct(pool.apy)}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">{formatUsd(pool.tvlUsd)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safest */}
        <div className="panel p-0 overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-2.5">
            <div className="text-[12px] font-semibold">🛡 Safest Pools</div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {safest.map((pool, i) => {
              const risk = riskMap.get(pool.id);
              return (
                <div
                  key={pool.id}
                  onClick={() => onSelectPool?.(pool)}
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold bg-[var(--blue-dim)] text-[var(--blue)]">{i + 1}</span>
                    <div>
                      <div className="text-[12px] font-medium">{pool.symbol}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">{pool.protocol} · {CHAIN_LABELS[pool.chain]}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-[var(--blue)]">Risk: {risk?.score}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{formatPct(pool.apy)} APY</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Stat Card ---
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, { accent: string; bg: string }> = {
    blue: { accent: 'var(--blue)', bg: 'var(--blue-dim)' },
    green: { accent: 'var(--green)', bg: 'var(--green-dim)' },
    amber: { accent: 'var(--amber)', bg: 'var(--amber-dim)' },
    red: { accent: 'var(--red)', bg: 'var(--red-dim)' },
    purple: { accent: 'var(--purple)', bg: 'var(--purple-dim)' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="panel p-4" style={{ borderLeft: `3px solid ${c.accent}` }}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-[22px] font-bold" style={{ color: c.accent }}>{value}</div>
    </div>
  );
}
