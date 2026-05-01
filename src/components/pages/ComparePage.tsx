// ============================================================
// Compare Page — Side-by-side pool comparison with history
// ============================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import type { DeFiPool, RiskAssessment } from '@/types';
import { formatUsd, formatPct, CHAIN_LABELS, CHAIN_COLORS } from '@/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface ComparePageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
}

interface HistoryData {
  date: string;
  apy: number;
  tvl: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function ComparePage({ pools, risks }: ComparePageProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [histories, setHistories] = useState<Map<string, HistoryData[]>>(new Map());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return pools
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => p.symbol.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q))
      .slice(0, 8);
  }, [pools, search, selectedIds]);

  const addPool = (id: string) => {
    if (selectedIds.length >= 4) return;
    setSelectedIds((prev) => [...prev, id]);
    setSearch('');
  };

  const removePool = (id: string) => {
    setSelectedIds((prev) => prev.filter((pid) => pid !== id));
  };

  // Fetch history for selected pools
  useEffect(() => {
    if (selectedIds.length === 0) return;
    const missing = selectedIds.filter((id) => !histories.has(id));
    if (missing.length === 0) return;

    setLoadingHistory(true);
    Promise.all(
      missing.map(async (id) => {
        try {
          const res = await fetch(`/api/history?poolId=${id}`);
          const json = await res.json();
          return { id, history: json.history || [] };
        } catch {
          return { id, history: [] };
        }
      })
    ).then((results) => {
      setHistories((prev) => {
        const next = new Map(prev);
        results.forEach((r) => next.set(r.id, r.history));
        return next;
      });
      setLoadingHistory(false);
    });
  }, [selectedIds, histories]);

  // Merge histories for chart
  const chartData = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const allDates = new Set<string>();
    selectedIds.forEach((id) => {
      const h = histories.get(id);
      if (h) h.forEach((d) => allDates.add(d.date));
    });

    const sortedDates = [...allDates].sort();
    // Sample every 7th point for performance
    const sampled = sortedDates.filter((_, i) => i % 7 === 0 || i === sortedDates.length - 1);

    return sampled.map((date) => {
      const point: Record<string, string | number> = { date };
      selectedIds.forEach((id) => {
        const pool = pools.find((p) => p.id === id);
        const h = histories.get(id);
        if (h && pool) {
          const entry = h.find((d) => d.date === date) || h.reduce((closest, d) =>
            Math.abs(new Date(d.date).getTime() - new Date(date).getTime()) <
            Math.abs(new Date(closest.date).getTime() - new Date(date).getTime()) ? d : closest
          );
          point[pool.symbol] = entry?.apy ?? 0;
        }
      });
      return point;
    });
  }, [selectedIds, histories, pools]);

  const selectedPools = selectedIds.map((id) => pools.find((p) => p.id === id)).filter(Boolean) as DeFiPool[];

  // Comparison metrics
  const metrics = [
    { label: 'APY', key: 'apy', format: formatPct, higher: true },
    { label: 'TVL', key: 'tvlUsd', format: formatUsd, higher: true },
    { label: '30d Avg', key: 'apyMean30d', format: formatPct, higher: true },
    { label: 'Stability', key: 'stabilityIndicator', format: (v: number) => `${(v * 100).toFixed(0)}%`, higher: true },
    { label: 'Volatility', key: 'volatilityProxy', format: (v: number) => `${(v * 100).toFixed(1)}%`, higher: false },
    { label: 'Risk Score', key: null, format: null, higher: false },
  ];

  return (
    <div className="space-y-5 animate-in">
      {/* Selector */}
      <div className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[12px] font-semibold">Compare Pools (up to 4)</div>
          <div className="text-[10px] text-[var(--text-muted)]">{selectedIds.length}/4 selected</div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">⌕</span>
            <input
              type="text"
              placeholder="Search pools to compare..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-[12px] outline-none focus:border-[var(--blue)]/50"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[250px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
                {searchResults.map((pool) => (
                  <div
                    key={pool.id}
                    onClick={() => addPool(pool.id)}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 text-[11px] hover:bg-white/[0.03]"
                  >
                    <div>
                      <span className="font-medium">{pool.symbol}</span>
                      <span className="ml-2 text-[var(--text-muted)]">{pool.protocol} · {CHAIN_LABELS[pool.chain]}</span>
                    </div>
                    <span className="text-[var(--green)]">{formatPct(pool.apy)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected chips */}
        {selectedPools.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPools.map((pool, i) => (
              <div
                key={pool.id}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px]"
                style={{ background: `${COLORS[i]}15`, border: `1px solid ${COLORS[i]}30` }}
              >
                <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="font-medium">{pool.symbol}</span>
                <span className="text-[var(--text-muted)]">{pool.protocol}</span>
                <button onClick={() => removePool(pool.id)} className="ml-1 text-[var(--text-muted)] hover:text-[var(--red)]">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selectedPools.length >= 2 && (
        <div className="panel p-0 overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-3">
            <div className="text-[12px] font-semibold">Side-by-Side Comparison</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Metric</th>
                  {selectedPools.map((pool, i) => (
                    <th key={pool.id} className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider" style={{ color: COLORS[i] }}>
                      {pool.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <td className="px-4 py-2 text-[var(--text-muted)]">Chain</td>
                  {selectedPools.map((pool) => (
                    <td key={pool.id} className="px-4 py-2 text-right">
                      <span style={{ color: CHAIN_COLORS[pool.chain] }}>{CHAIN_LABELS[pool.chain]}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-2 text-[var(--text-muted)]">Protocol</td>
                  {selectedPools.map((pool) => (
                    <td key={pool.id} className="px-4 py-2 text-right">{pool.protocol}</td>
                  ))}
                </tr>
                {metrics.map((m) => (
                  <tr key={m.label}>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{m.label}</td>
                    {selectedPools.map((pool) => {
                      let value: string;
                      let isBest = false;
                      if (m.key === null) {
                        // Risk score
                        const risk = riskMap.get(pool.id);
                        value = risk ? String(risk.score) : '—';
                        if (risk && selectedPools.length >= 2) {
                          const risks = selectedPools.map((p) => riskMap.get(p.id)?.score ?? 999);
                          isBest = risk.score === Math.min(...risks);
                        }
                      } else {
                        const raw = (pool as unknown as Record<string, unknown>)[m.key];
                        value = m.format ? m.format(raw as number) : String(raw);
                        if (selectedPools.length >= 2) {
                          const vals = selectedPools.map((p) => (p as unknown as Record<string, unknown>)[m.key] as number);
                          const best = m.higher ? Math.max(...vals) : Math.min(...vals);
                          isBest = raw === best;
                        }
                      }
                      return (
                        <td key={pool.id} className={`px-4 py-2 text-right font-mono ${isBest ? 'font-semibold text-[var(--green)]' : ''}`}>
                          {value} {isBest && '✓'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical APY Chart */}
      {selectedPools.length >= 2 && chartData.length > 0 && (
        <div className="panel p-0 overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-3">
            <div className="text-[12px] font-semibold">Historical APY Comparison</div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {loadingHistory ? 'Loading history...' : `${chartData.length} data points`}
            </div>
          </div>
          <div className="h-[320px] px-2 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                  formatter={(v, name) => [`${Number(v).toFixed(2)}%`, name]}
                />
                {selectedPools.map((pool, i) => (
                  <Area
                    key={pool.id}
                    type="monotone"
                    dataKey={pool.symbol}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.05}
                    strokeWidth={1.5}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 border-t border-[var(--border)] py-2">
            {selectedPools.map((pool, i) => (
              <div key={pool.id} className="flex items-center gap-1.5 text-[10px]">
                <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                {pool.symbol}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {selectedPools.length < 2 && (
        <div className="panel flex h-[200px] items-center justify-center">
          <div className="text-center text-[var(--text-muted)]">
            <div className="text-2xl opacity-30">⇄</div>
            <div className="mt-2 text-[12px]">Select at least 2 pools to compare</div>
          </div>
        </div>
      )}
    </div>
  );
}
