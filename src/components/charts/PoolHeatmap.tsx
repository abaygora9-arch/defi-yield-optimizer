// ============================================================
// Pool Heatmap — Visual grid colored by APY/Risk ratio
// ============================================================

'use client';

import { useMemo, useState, useCallback } from 'react';
import type { DeFiPool, RiskAssessment } from '@/types';
import { formatUsd, formatPct, CHAIN_LABELS } from '@/utils';
import { Card } from '@/components/ui';

interface PoolHeatmapProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
}

interface HeatmapCell {
  pool: DeFiPool;
  risk: RiskAssessment | undefined;
  ratio: number;       // APY / Risk score (higher = better)
  normalizedRatio: number; // 0-1
  size: number;        // based on TVL
}

/** Interpolate between red (bad) and green (good) */
function ratioToColor(normalizedRatio: number): string {
  // 0 = red (bad ratio), 0.5 = yellow, 1 = green (good ratio)
  const t = Math.max(0, Math.min(1, normalizedRatio));
  if (t < 0.5) {
    // Red to yellow
    const s = t * 2;
    const r = 239;
    const g = Math.round(68 + (180 - 68) * s);
    const b = Math.round(68 + (68 - 68) * s);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to green
    const s = (t - 0.5) * 2;
    const r = Math.round(239 - (239 - 34) * s);
    const g = Math.round(180 + (197 - 180) * s);
    const b = Math.round(68 + (94 - 68) * s);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export function PoolHeatmap({ pools, risks }: PoolHeatmapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);

  const cells = useMemo((): HeatmapCell[] => {
    // Only show pools with risk data
    const withRisk = pools.filter((p) => riskMap.has(p.id));

    // Calculate APY/Risk ratio
    const rawData = withRisk.map((pool) => {
      const risk = riskMap.get(pool.id)!;
      const riskScore = Math.max(risk.score, 1); // avoid /0
      const ratio = pool.apy / riskScore;
      return { pool, risk, ratio };
    });

    // Normalize ratios to 0-1
    const ratios = rawData.map((d) => d.ratio);
    const minRatio = Math.min(...ratios);
    const maxRatio = Math.max(...ratios);
    const range = maxRatio - minRatio || 1;

    // Normalize TVL for sizing
    const tvls = rawData.map((d) => d.pool.tvlUsd);
    const maxTvl = Math.max(...tvls, 1);
    const minTvl = Math.min(...tvls);

    return rawData.map((d) => ({
      pool: d.pool,
      risk: d.risk,
      ratio: d.ratio,
      normalizedRatio: (d.ratio - minRatio) / range,
      // Size: min 24px, max 48px, scaled by log TVL
      size: 24 + Math.round((Math.log10(d.pool.tvlUsd + 1) / Math.log10(maxTvl + 1)) * 24),
    }));
  }, [pools, riskMap]);

  // Sort by ratio descending (best first)
  const sortedCells = useMemo(
    () => [...cells].sort((a, b) => b.ratio - a.ratio),
    [cells]
  );

  const handleMouseEnter = useCallback((index: number, e: React.MouseEvent) => {
    setHoveredIndex(index);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const hoveredCell = hoveredIndex !== null ? sortedCells[hoveredIndex] : null;

  // Summary stats
  const summary = useMemo(() => {
    if (cells.length === 0) return null;
    const avgRatio = cells.reduce((s, c) => s + c.ratio, 0) / cells.length;
    const bestCell = cells.reduce((best, c) => (c.ratio > best.ratio ? c : best), cells[0]);
    const worstCell = cells.reduce((worst, c) => (c.ratio < worst.ratio ? c : worst), cells[0]);
    return { count: cells.length, avgRatio, bestCell, worstCell };
  }, [cells]);

  return (
    <Card className="glass glow-green p-0 overflow-hidden">
      <div className="border-b border-[var(--glass-border)] px-5 py-3">
        <div className="text-sm font-semibold">Pool Heatmap</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">
          Color = APY/Risk ratio · Size = TVL · {sortedCells.length} pools
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--glass-border)]/50">
        <div className="flex items-center gap-4 text-[10px] text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: ratioToColor(0) }} />
            <span>Low ratio (risky)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: ratioToColor(0.5) }} />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: ratioToColor(1) }} />
            <span>High ratio (optimal)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm border border-white/20" style={{ width: 24, height: 24 }} />
            <span>Low TVL</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm border border-white/20" style={{ width: 48, height: 48 }} />
            <span>High TVL</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative p-5">
        <div className="flex flex-wrap gap-1.5">
          {sortedCells.map((cell, i) => (
            <div
              key={cell.pool.id}
              onMouseEnter={(e) => handleMouseEnter(i, e)}
              onMouseLeave={handleMouseLeave}
              className="cursor-pointer rounded-sm transition-all hover:brightness-110 hover:scale-110 hover:z-10"
              style={{
                width: cell.size,
                height: cell.size,
                background: ratioToColor(cell.normalizedRatio),
                opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4,
                boxShadow: hoveredIndex === i ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div
            className="glass pointer-events-none fixed z-[100] rounded-xl px-4 py-3 shadow-xl"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="text-sm font-bold">{hoveredCell.pool.symbol}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">
              {hoveredCell.pool.protocol} · {CHAIN_LABELS[hoveredCell.pool.chain]}
            </div>
            <div className="mt-2 space-y-0.5 text-xs">
              <div>
                APY: <span className="font-mono text-[var(--success)]">{formatPct(hoveredCell.pool.apy)}</span>
              </div>
              <div>
                Risk: <span className="font-mono">{hoveredCell.risk?.score ?? '—'}</span>
                {hoveredCell.risk && (
                  <span className="ml-1 text-[var(--muted-foreground)]">({hoveredCell.risk.category})</span>
                )}
              </div>
              <div>
                TVL: <span className="font-mono">{formatUsd(hoveredCell.pool.tvlUsd)}</span>
              </div>
              <div>
                Ratio:{' '}
                <span
                  className="font-mono font-semibold"
                  style={{ color: ratioToColor(hoveredCell.normalizedRatio) }}
                >
                  {hoveredCell.ratio.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-px border-t border-[var(--glass-border)]/50">
          <div className="bg-white/[0.02] px-4 py-2 text-center">
            <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Best Ratio</div>
            <div className="mt-0.5 text-xs font-mono font-semibold text-[var(--success)]">
              {summary.bestCell.pool.symbol} ({summary.bestCell.ratio.toFixed(3)})
            </div>
          </div>
          <div className="bg-white/[0.02] px-4 py-2 text-center">
            <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Avg Ratio</div>
            <div className="mt-0.5 text-xs font-mono font-semibold">{summary.avgRatio.toFixed(3)}</div>
          </div>
          <div className="bg-white/[0.02] px-4 py-2 text-center">
            <div className="text-[9px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Worst Ratio</div>
            <div className="mt-0.5 text-xs font-mono font-semibold text-[var(--danger)]">
              {summary.worstCell.pool.symbol} ({summary.worstCell.ratio.toFixed(3)})
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
