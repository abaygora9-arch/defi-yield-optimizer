// ============================================================
// Strategies Page — Mode Recommendations
// ============================================================

'use client';

import { useMemo } from 'react';
import type { DeFiPool, RiskAssessment, StrategyRanking, StrategyMode } from '@/types';
import { Card, Badge } from '@/components/ui';
import { formatUsd, formatPct, CHAIN_LABELS, RISK_COLORS } from '@/utils';

interface StrategiesPageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  rankings: StrategyRanking[];
  mode: StrategyMode;
  onSelectPool: (pool: DeFiPool) => void;
}

export function StrategiesPage({ pools, risks, rankings, mode, onSelectPool }: StrategiesPageProps) {
  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);
  const poolMap = useMemo(() => new Map(pools.map((p) => [p.id, p])), [pools]);

  const nonTrap = useMemo(() => rankings.filter((r) => !r.isTrapPool), [rankings]);
  const traps = useMemo(() => rankings.filter((r) => r.isTrapPool), [rankings]);

  const top10 = useMemo(() => nonTrap.slice(0, 10), [nonTrap]);

  const modeConfig = {
    conservative: {
      title: '🛡 Conservative Strategy',
      desc: 'Minimize risk. Prioritize capital preservation with stable, predictable yields.',
      weights: 'α=0.2 · β=0.6 · γ=0.2',
      gradient: 'from-blue-500/15 to-cyan-500/5',
      glow: 'glow-blue',
      accent: 'text-blue-400',
    },
    balanced: {
      title: '⚖ Balanced Strategy',
      desc: 'Optimize risk-reward ratio. Moderate allocation across diversified pools.',
      weights: 'α=0.4 · β=0.3 · γ=0.3',
      gradient: 'from-purple-500/15 to-pink-500/5',
      glow: 'glow-purple',
      accent: 'text-purple-400',
    },
    aggressive: {
      title: '🔥 Aggressive Strategy',
      desc: 'Maximize returns. Higher risk tolerance for outsized yield opportunities.',
      weights: 'α=0.7 · β=0.15 · γ=0.15',
      gradient: 'from-orange-500/15 to-red-500/5',
      glow: 'glow-orange',
      accent: 'text-orange-400',
    },
  };

  const cfg = modeConfig[mode];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mode Header */}
      <div className={`glass ${cfg.glow} bg-gradient-to-r ${cfg.gradient} p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-xl font-bold ${cfg.accent}`}>{cfg.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{cfg.desc}</p>
            <div className="mt-2 text-[10px] font-mono text-[var(--muted-foreground)]">
              Weights: {cfg.weights}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold gradient-text">{top10.length}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">Recommended</div>
          </div>
        </div>
      </div>

      {/* Top Recommendations */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">🏆 Top Recommendations</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {top10.map((rank, i) => {
            const pool = poolMap.get(rank.poolId);
            const risk = riskMap.get(rank.poolId);
            if (!pool || !risk) return null;

            return (
              <div
                key={rank.poolId}
                onClick={() => onSelectPool(pool)}
                className="glass group cursor-pointer p-4 transition-all hover:bg-white/10 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                      i < 3 ? 'bg-gradient-to-br from-amber-400/30 to-amber-600/10 text-amber-400' : 'bg-white/10 text-[var(--muted-foreground)]'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{pool.symbol}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        {pool.protocol} · {CHAIN_LABELS[pool.chain]}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[var(--success)]">{formatPct(pool.apy)}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">APY</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-[11px]">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Score:</span>{' '}
                    <span className="font-mono font-semibold">{rank.score.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Risk:</span>{' '}
                    <Badge variant={risk.score < 30 ? 'success' : risk.score < 60 ? 'warning' : 'danger'}>
                      {risk.score}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">TVL:</span>{' '}
                    <span className="font-mono">{formatUsd(pool.tvlUsd)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Stability:</span>{' '}
                    <span className="font-mono">{(pool.stabilityIndicator * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trap Pools */}
      {traps.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[var(--danger)]">
            ⚠ Trap Pools Detected ({traps.length})
          </h3>
          <div className="space-y-2">
            {traps.slice(0, 8).map((rank) => {
              const pool = poolMap.get(rank.poolId);
              if (!pool) return null;
              return (
                <div key={rank.poolId} className="glass flex items-center justify-between border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3">
                  <div>
                    <div className="text-sm font-medium">{pool.symbol}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {pool.protocol} · {CHAIN_LABELS[pool.chain]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[var(--danger)]">{formatPct(pool.apy)} APY</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{rank.trapReason}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
