// ============================================================
// Pool Analyzer — Detail panel with history + DefiLlama link
// ============================================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DeFiPool, RiskAssessment, StrategyMode } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import { formatUsd, formatPct, CHAIN_LABELS, CHAIN_COLORS, RISK_COLORS } from '@/utils';
import { useSimulation } from '@/hooks/useData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface PoolAnalyzerProps {
  pool: DeFiPool;
  risk: RiskAssessment;
  mode: StrategyMode;
  onClose: () => void;
}

export function PoolAnalyzer({ pool, risk, mode, onClose }: PoolAnalyzerProps) {
  const { result, loading: simLoading, simulate } = useSimulation();
  const [capital, setCapital] = useState(10000);
  const [days, setDays] = useState(365);
  const [history, setHistory] = useState<{ date: string; apy: number; tvl: number }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'simulate'>('overview');

  const riskColor = RISK_COLORS[risk.category] || '#94a3b8';

  // Fetch history
  useEffect(() => {
    setHistoryLoading(true);
    fetch(`/api/history?poolId=${pool.id}`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data.history || []);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  }, [pool.id]);

  // History stats
  const historyStats = useMemo(() => {
    if (history.length === 0) return null;
    const apys = history.map((d) => d.apy).filter((v) => v > 0);
    return {
      min: Math.min(...apys),
      max: Math.max(...apys),
      avg: apys.reduce((a, b) => a + b, 0) / apys.length,
      points: history.length,
      from: history[0]?.date,
      to: history[history.length - 1]?.date,
    };
  }, [history]);

  const factorLabels: Record<string, string> = {
    tvlRisk: 'TVL Risk',
    apyAnomaly: 'APY Anomaly',
    volatility: 'Volatility',
    protocolMaturity: 'Protocol Maturity',
    liquidityRisk: 'Liquidity Risk',
  };

  // Sample history for chart (every 3rd point for perf)
  const chartHistory = useMemo(() => {
    return history.filter((_, i) => i % 3 === 0 || i === history.length - 1);
  }, [history]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8 backdrop-blur-md">
      <div className="w-full max-w-3xl space-y-4 pb-8">
        {/* Header */}
        <div className="panel overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--blue)]/10 to-[var(--purple)]/5 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{pool.symbol}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)]">{pool.protocol}</span>
                  <span className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: `${CHAIN_COLORS[pool.chain]}20`, color: CHAIN_COLORS[pool.chain] }}>
                    {CHAIN_LABELS[pool.chain]}
                  </span>
                  {pool.stablecoin && <Badge variant="success">Stablecoin</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pool.url && (
                  <a href={pool.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--blue)] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[var(--blue)]/80 transition-colors shadow-lg shadow-blue-500/20">
                    ↗ Open on DefiLlama
                  </a>
                )}
                <button onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm transition-colors hover:bg-white/20">
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 divide-x divide-[var(--border)]">
            <QuickStat label="APY" value={formatPct(pool.apy)} color="text-[var(--green)]" />
            <QuickStat label="TVL" value={formatUsd(pool.tvlUsd)} color="text-[var(--blue)]" />
            <QuickStat label="Risk" value={`${risk.score}/100`} color={riskColor} />
            <QuickStat label="Stability" value={`${(pool.stabilityIndicator * 100).toFixed(0)}%`} color="text-[var(--purple)]" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-[var(--bg-primary)] p-1">
          {([
            { id: 'overview', label: '📊 Overview' },
            { id: 'history', label: '📈 History' },
            { id: 'simulate', label: '🧮 Simulate' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--blue-dim)] text-[var(--blue)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in">
            {/* Risk Breakdown */}
            <div className="panel p-4">
              <div className="mb-4 text-[12px] font-semibold">Risk Factor Breakdown</div>
              <div className="space-y-3">
                {Object.entries(risk.factors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-32 text-[11px] text-[var(--text-muted)]">{factorLabels[key]}</div>
                    <div className="flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${value * 100}%`,
                            background: value < 0.3 ? '#10b981' : value < 0.6 ? '#f59e0b' : '#ef4444',
                          }} />
                      </div>
                    </div>
                    <div className="w-10 text-right text-[11px] font-mono">{(value * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Confidence: {(risk.confidence * 100).toFixed(0)}%</span>
                <span>Category: <span style={{ color: riskColor }} className="font-medium">{risk.category}</span></span>
              </div>
            </div>

            {/* Pool Details */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="panel p-4">
                <div className="mb-2 text-[11px] font-semibold text-[var(--text-muted)]">Yield Details</div>
                <div className="space-y-1.5 text-[11px]">
                  <DetailRow label="Current APY" value={formatPct(pool.apy)} highlight />
                  <DetailRow label="30d Avg APY" value={formatPct(pool.apyMean30d)} />
                  <DetailRow label="Base APY" value={formatPct(pool.apyBase)} />
                  <DetailRow label="Reward APY" value={pool.apyReward ? formatPct(pool.apyReward) : 'N/A'} />
                </div>
              </div>
              <div className="panel p-4">
                <div className="mb-2 text-[11px] font-semibold text-[var(--text-muted)]">Pool Properties</div>
                <div className="space-y-1.5 text-[11px]">
                  <DetailRow label="TVL" value={formatUsd(pool.tvlUsd)} highlight />
                  <DetailRow label="IL Risk" value={pool.ilRisk} />
                  <DetailRow label="Exposure" value={pool.exposure} />
                  <DetailRow label="Volatility" value={`${(pool.volatilityProxy * 100).toFixed(1)}%`} />
                  <DetailRow label="Liquidity Score" value={`${(pool.liquidityDepthScore * 100).toFixed(0)}%`} />
                </div>
              </div>
            </div>

            {/* DefiLlama Link */}
            {pool.url && (
              <a href={pool.url} target="_blank" rel="noopener noreferrer"
                className="panel flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors cursor-pointer">
                <div>
                  <div className="text-[12px] font-medium">View on DefiLlama</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Full pool details, historical data, and protocol info</div>
                </div>
                <span className="text-[var(--blue)] text-[14px]">↗</span>
              </a>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in">
            {historyLoading ? (
              <div className="panel flex h-[200px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[var(--blue)]/30 border-t-[var(--blue)]" />
                  <div className="text-[11px] text-[var(--text-muted)]">Loading historical data...</div>
                </div>
              </div>
            ) : history.length > 0 ? (
              <>
                {/* History Stats */}
                {historyStats && (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MiniStat label="Min APY" value={formatPct(historyStats.min)} color="var(--red)" />
                    <MiniStat label="Max APY" value={formatPct(historyStats.max)} color="var(--green)" />
                    <MiniStat label="Avg APY" value={formatPct(historyStats.avg)} color="var(--blue)" />
                    <MiniStat label="Data Points" value={String(historyStats.points)} color="var(--purple)" />
                  </div>
                )}

                {/* APY History Chart */}
                <div className="panel p-0 overflow-hidden">
                  <div className="border-b border-[var(--border)] px-5 py-3">
                    <div className="text-[12px] font-semibold">APY History</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {historyStats?.from} → {historyStats?.to}
                    </div>
                  </div>
                  <div className="h-[280px] px-2 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartHistory}>
                        <defs>
                          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getFullYear().toString().slice(2)}`; }}
                          interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                          labelFormatter={(l) => new Date(l).toLocaleDateString()}
                          formatter={(v) => [`${Number(v).toFixed(2)}%`, 'APY']}
                        />
                        <Area type="monotone" dataKey="apy" stroke="#3b82f6" strokeWidth={2} fill="url(#histGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* TVL History Chart */}
                <div className="panel p-0 overflow-hidden">
                  <div className="border-b border-[var(--border)] px-5 py-3">
                    <div className="text-[12px] font-semibold">TVL History</div>
                  </div>
                  <div className="h-[200px] px-2 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartHistory}>
                        <defs>
                          <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getFullYear().toString().slice(2)}`; }}
                          interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v)/1e9).toFixed(1)}B`} />
                        <Tooltip
                          contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                          formatter={(v) => [formatUsd(Number(v)), 'TVL']}
                        />
                        <Area type="monotone" dataKey="tvl" stroke="#10b981" strokeWidth={2} fill="url(#tvlGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="panel flex h-[200px] items-center justify-center text-[12px] text-[var(--text-muted)]">
                No historical data available
              </div>
            )}
          </div>
        )}

        {activeTab === 'simulate' && (
          <div className="space-y-4 animate-in">
            <div className="panel p-4">
              <div className="mb-4 text-[12px] font-semibold">Simulation Parameters</div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)]">Capital ($)</label>
                  <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
                    className="w-28 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-[12px] outline-none focus:border-[var(--blue)]/50" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-[var(--text-muted)]">Days</label>
                  <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))}
                    className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-[12px] outline-none focus:border-[var(--blue)]/50" />
                </div>
                <Button onClick={() => simulate(pool, capital, days, mode)} disabled={simLoading}
                  className="bg-gradient-to-r from-[var(--blue)] to-[var(--purple)]">
                  {simLoading ? '⏳ Simulating...' : '▶ Run Monte Carlo'}
                </Button>
              </div>
            </div>

            {result && (
              <div className="space-y-4 animate-in">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MiniStat label="Expected" value={formatUsd(result.simulation.expectedReturn)} color="var(--blue)" />
                  <MiniStat label="Best (95th)" value={formatUsd(result.simulation.bestCase)} color="var(--green)" />
                  <MiniStat label="Worst (5th)" value={formatUsd(result.simulation.worstCase)} color="var(--red)" />
                  <MiniStat label="Sharpe" value={result.simulation.sharpeLikeRatio.toFixed(3)} color="var(--purple)" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Net Return" value={formatUsd(result.simulation.netReturn)} color="var(--green)" />
                  <MiniStat label="IL Estimate" value={`${result.simulation.impermanentLossEstimate.toFixed(2)}%`} color="var(--amber)" />
                  <MiniStat label="Gas Impact" value={`${result.simulation.gasImpact.toFixed(2)}%`} color="var(--text-muted)" />
                </div>

                {/* Growth Chart */}
                <div className="panel p-0 overflow-hidden">
                  <div className="border-b border-[var(--border)] px-5 py-3">
                    <div className="text-[12px] font-semibold">Growth Projection</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {formatUsd(capital)} → {formatUsd(result.simulation.expectedReturn)} in {days} days
                    </div>
                  </div>
                  <div className="h-[250px] px-2 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.simulation.growthCurve}>
                        <defs>
                          <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}K`} />
                        <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 8, fontSize: 11 }}
                          formatter={(v) => [formatUsd(Number(v)), 'Value']} labelFormatter={(l) => `Day ${l}`} />
                        <ReferenceLine y={capital} stroke="#64748b" strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#simGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Explanation */}
                <div className="panel bg-[var(--blue-dim)] p-4">
                  <div className="mb-2 text-[12px] font-semibold text-[var(--blue)]">{result.explanation.headline}</div>
                  <ul className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                    {result.explanation.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-[var(--blue)]">▸</span>{insight}</li>
                    ))}
                  </ul>
                  <div className="mt-2 text-[11px]"><strong className="text-[var(--blue)]">Recommendation:</strong> {result.explanation.recommendation}</div>
                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">{result.explanation.riskNote}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="px-4 py-3 text-center">
      <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`font-mono ${highlight ? 'font-semibold text-[var(--green)]' : ''}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel p-3" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
