// ============================================================
// Dashboard — Pool Table
// ============================================================

'use client';

import type { DeFiPool, RiskAssessment, StrategyRanking } from '@/types';
import { Badge, Card } from '@/components/ui';
import { formatUsd, formatPct, CHAIN_LABELS, RISK_COLORS } from '@/utils';

interface PoolTableProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  rankings: StrategyRanking[];
  onSelect: (pool: DeFiPool) => void;
  loading: boolean;
}

function riskBadgeVariant(score: number): 'success' | 'warning' | 'danger' | 'info' {
  if (score < 30) return 'success';
  if (score < 50) return 'info';
  if (score < 70) return 'warning';
  return 'danger';
}

export function PoolTable({
  pools,
  risks,
  rankings,
  onSelect,
  loading,
}: PoolTableProps) {
  const riskMap = new Map(risks.map((r) => [r.poolId, r]));
  const rankMap = new Map(rankings.map((r) => [r.poolId, r]));

  if (loading) {
    return (
      <Card>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="h-5 w-16 rounded bg-muted" />
              <div className="h-5 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pool</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Chain</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">TVL</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">APY</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">30d Avg</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Risk</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Stability</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Score</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => {
              const risk = riskMap.get(pool.id);
              const rank = rankMap.get(pool.id);

              return (
                <tr
                  key={pool.id}
                  onClick={() => onSelect(pool)}
                  className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{pool.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {pool.protocol}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="chain">
                      {CHAIN_LABELS[pool.chain]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatUsd(pool.tvlUsd)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-green-500">
                    {formatPct(pool.apy)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {formatPct(pool.apyMean30d)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {risk && (
                      <Badge variant={riskBadgeVariant(risk.score)}>
                        {risk.score} — {risk.category}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="mx-auto h-2 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pool.stabilityIndicator * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold">
                    {rank?.score.toFixed(3) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rank?.isTrapPool ? (
                      <Badge variant="danger">🪤 Trap</Badge>
                    ) : pool.stablecoin ? (
                      <Badge variant="success">Stable</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pools.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No pools match your filters.
        </div>
      )}
    </Card>
  );
}
