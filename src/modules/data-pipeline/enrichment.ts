// ============================================================
// Data Pipeline — Enrichment Engine
// ============================================================

import type { DeFiPool } from '@/types';
import { normalize, logNormalize, clamp } from '@/utils';

const TVL_MIN = 1_000;
const TVL_MAX = 1_000_000_000;

/** Compute volatility proxy: how much does APY deviate from 30d mean? */
function computeVolatility(pool: DeFiPool): number {
  const deviation = Math.abs(pool.apy - pool.apyMean30d);
  const base = Math.max(pool.apyMean30d, 1);
  const ratio = deviation / base;
  // Higher ratio = higher volatility
  return clamp(ratio, 0, 1);
}

/** Compute liquidity depth score based on TVL */
function computeLiquidityDepth(pool: DeFiPool): number {
  // Higher TVL = higher liquidity score (inverted risk)
  return 1 - logNormalize(pool.tvlUsd, TVL_MIN, TVL_MAX);
}

/** Compute stability indicator */
function computeStability(pool: DeFiPool): number {
  let score = 0.5; // baseline

  // Stablecoin pools get a bonus
  if (pool.stablecoin) score += 0.2;

  // Low IL risk gets a bonus
  if (pool.ilRisk === 'no') score += 0.15;
  else if (pool.ilRisk === 'yes') score -= 0.15;

  // Single exposure is simpler / more stable
  if (pool.exposure === 'single') score += 0.1;

  // Low volatility is more stable
  const vol = computeVolatility(pool);
  score += (1 - vol) * 0.15;

  // High TVL is more stable
  const liq = computeLiquidityDepth(pool);
  score += (1 - liq) * 0.1; // low liqRisk = more stable

  return clamp(score, 0, 1);
}

/** Enrich all pools with computed metrics */
export function enrichPools(pools: DeFiPool[]): DeFiPool[] {
  return pools.map((pool) => ({
    ...pool,
    volatilityProxy: computeVolatility(pool),
    liquidityDepthScore: computeLiquidityDepth(pool),
    stabilityIndicator: computeStability(pool),
  }));
}
