// ============================================================
// Portfolio Builder — Multi-pool allocation simulator
// ============================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { DeFiPool, RiskAssessment } from '@/types';
import { Card, Button } from '@/components/ui';
import { formatUsd, formatPct, CHAIN_LABELS } from '@/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';

interface Allocation {
  poolId: string;
  weight: number; // 0-100
}

interface PortfolioBuilderProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function PortfolioBuilder({ pools, risks }: PortfolioBuilderProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [capital, setCapital] = useState(10000);
  const [days, setDays] = useState(365);
  const [search, setSearch] = useState('');
  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);
  const poolMap = useMemo(() => new Map(pools.map((p) => [p.id, p])), [pools]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return pools
      .filter((p) => !allocations.find((a) => a.poolId === p.id))
      .filter((p) => p.symbol.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q))
      .slice(0, 10);
  }, [pools, search, allocations]);

  const addPool = useCallback((poolId: string) => {
    const remaining = 100 - allocations.reduce((s, a) => s + a.weight, 0);
    if (remaining <= 0) return;
    const weight = Math.min(remaining, allocations.length === 0 ? 100 : Math.max(10, remaining));
    setAllocations((prev) => [...prev, { poolId, weight }]);
    setSearch('');
  }, [allocations]);

  const removePool = useCallback((poolId: string) => {
    setAllocations((prev) => prev.filter((a) => a.poolId !== poolId));
  }, []);

  const updateWeight = useCallback((poolId: string, weight: number) => {
    setAllocations((prev) =>
      prev.map((a) => (a.poolId === poolId ? { ...a, weight: Math.max(0, Math.min(100, weight)) } : a))
    );
  }, []);

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);

  // Portfolio simulation
  const simulation = useMemo(() => {
    if (allocations.length === 0 || totalWeight === 0) return null;

    // Weighted APY
    const weightedApy = allocations.reduce((sum, a) => {
      const pool = poolMap.get(a.poolId);
      if (!pool) return sum;
      return sum + (pool.apy * a.weight) / 100;
    }, 0);

    // Weighted risk
    const weightedRisk = allocations.reduce((sum, a) => {
      const risk = riskMap.get(a.poolId);
      if (!risk) return sum;
      return sum + (risk.score * a.weight) / 100;
    }, 0);

    // Growth curve
    const curve: { day: number; value: number }[] = [];
    let value = capital;
    for (let d = 0; d <= days; d++) {
      curve.push({ day: d, value: Math.round(value * 100) / 100 });
      value *= (1 + weightedApy / 100 / 365);
    }

    // Diversification score (how spread out)
    const herfindahl = allocations.reduce((sum, a) => sum + (a.weight / 100) ** 2, 0);
    const diversification = 1 - herfindahl; // 0 = concentrated, 1 = perfectly spread

    return {
      weightedApy,
      weightedRisk,
      expectedReturn: value,
      netReturn: value - capital,
      curve,
      diversification,
    };
  }, [allocations, capital, days, poolMap, riskMap, totalWeight]);

  const pieData = allocations.map((a, i) => {
    const pool = poolMap.get(a.poolId);
    return {
      name: pool?.symbol ?? a.poolId,
      value: a.weight,
      color: COLORS[i % COLORS.length],
    };
  });

  return (
    <div className="space-y-5 animate-in">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pool Selector */}
        <div className="panel p-4 lg:col-span-1">
          <div className="mb-3 text-[12px] font-semibold">Add Pool to Portfolio</div>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">⌕</span>
            <input
              type="text"
              placeholder="Search pools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--blue)]/50"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-[300px] space-y-0.5 overflow-y-auto">
              {searchResults.map((pool) => (
                <div
                  key={pool.id}
                  onClick={() => addPool(pool.id)}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[11px] hover:bg-white/[0.03]"
                >
                  <div>
                    <div className="font-medium">{pool.symbol}</div>
                    <div className="text-[var(--text-muted)]">{pool.protocol}</div>
                  </div>
                  <div className="text-[var(--green)]">{formatPct(pool.apy)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Capital + Days */}
          <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
            <div>
              <label className="mb-1 block text-[10px] text-[var(--text-muted)]">Capital (USD)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-[12px] text-[var(--text-primary)] outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-[var(--text-muted)]">Days</label>
              <input
                type="range"
                min={7}
                max={730}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full accent-[var(--blue)]"
              />
              <div className="text-[10px] text-[var(--text-muted)]">{days} days</div>
            </div>
          </div>
        </div>

        {/* Allocations */}
        <div className="panel p-4 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-semibold">Allocations</div>
            <div className={`text-[11px] font-mono ${totalWeight === 100 ? 'text-[var(--green)]' : totalWeight > 100 ? 'text-[var(--red)]' : 'text-[var(--amber)]'}`}>
              {totalWeight}% / 100%
            </div>
          </div>
          {allocations.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-[12px] text-[var(--text-muted)]">
              Search and add pools above
            </div>
          ) : (
            <div className="space-y-2">
              {allocations.map((a, i) => {
                const pool = poolMap.get(a.poolId);
                const risk = riskMap.get(a.poolId);
                return (
                  <div key={a.poolId} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2.5">
                    <div className="h-3 w-1 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium truncate">{pool?.symbol}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">
                        {pool?.protocol} · {formatPct(pool?.apy ?? 0)} APY · Risk:{risk?.score}
                      </div>
                    </div>
                    <input
                      type="number"
                      value={a.weight}
                      onChange={(e) => updateWeight(a.poolId, Number(e.target.value))}
                      className="w-14 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-center text-[11px] font-mono outline-none"
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">%</span>
                    <button
                      onClick={() => removePool(a.poolId)}
                      className="text-[var(--text-muted)] hover:text-[var(--red)] text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="panel p-4">
          <div className="mb-3 text-[12px] font-semibold">Allocation</div>
          {pieData.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                      formatter={(v) => [`${v}%`, 'Allocation']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[11px] text-[var(--text-muted)]">
              Add pools to see allocation
            </div>
          )}
        </div>
      </div>

      {/* Simulation Results */}
      {simulation && (
        <div className="space-y-4 animate-in">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MiniStat label="Weighted APY" value={formatPct(simulation.weightedApy)} color="var(--green)" />
            <MiniStat label="Weighted Risk" value={simulation.weightedRisk.toFixed(1)} color="var(--amber)" />
            <MiniStat label="Expected Return" value={formatUsd(simulation.expectedReturn)} color="var(--blue)" />
            <MiniStat label="Net Profit" value={formatUsd(simulation.netReturn)} color="var(--green)" />
            <MiniStat label="Diversification" value={`${(simulation.diversification * 100).toFixed(0)}%`} color="var(--purple)" />
          </div>

          {/* Growth Chart */}
          <div className="panel p-0 overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3">
              <div className="text-[12px] font-semibold">Portfolio Growth Projection</div>
              <div className="text-[10px] text-[var(--text-muted)]">{formatUsd(capital)} → {formatUsd(simulation.expectedReturn)} in {days} days</div>
            </div>
            <div className="h-[280px] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation.curve}>
                  <defs>
                    <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
                  <Tooltip
                    contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v) => [formatUsd(Number(v)), 'Value']}
                    labelFormatter={(l) => `Day ${l}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#portGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel p-3" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-0.5 text-[16px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
