// ============================================================
// Risk Engine — Multi-Factor Weighted Model
// ============================================================
//
// Risk Score R = w1(TVL risk) + w2(APY anomaly) + w3(volatility)
//              + w4(protocol maturity) + w5(liquidity risk)
//
// All factors normalized to [0, 1]. Output: score 0–100.
// ============================================================

import type { DeFiPool, RiskFactors, RiskAssessment } from '@/types';
import { clamp, normalize, logNormalize, mean, stdDev } from '@/utils';

// --- Weights (sum to 1.0) ---
const WEIGHTS = {
  tvlRisk: 0.25,
  apyAnomaly: 0.20,
  volatility: 0.20,
  protocolMaturity: 0.15,
  liquidityRisk: 0.20,
};

// --- TVL thresholds ---
const TVL_MIN = 1_000;
const TVL_MAX = 1_000_000_000;

// --- Known mature protocols (higher = more mature) ---
const MATURE_PROTOCOLS = new Set([
  'aave', 'compound', 'lido', 'uniswap', 'curve', 'convex',
  'makerdao', 'yearn-finance', 'sushiswap', 'balancer',
  'pancakeswap', 'quickswap', 'gmx', 'radiant',
]);

const SEMI_MATURE_PROTOCOLS = new Set([
  'stargate', 'morpho', 'rocket-pool', 'pendle', 'ethena',
  'eigenlayer', 'renzo', 'ether.fi', 'kamino', 'marinade',
]);

// --- Factor Calculations ---

/** TVL Risk: lower TVL = higher risk */
function calcTvlRisk(pool: DeFiPool): number {
  // Inverted log scale — low TVL is risky
  const liquidityScore = logNormalize(pool.tvlUsd, TVL_MIN, TVL_MAX);
  return 1 - liquidityScore;
}

// Pre-computed APY stats (cached per batch)
let cachedApyStats: { mean: number; std: number } | null = null;

function getApyStats(pools: DeFiPool[]): { mean: number; std: number } {
  if (cachedApyStats) return cachedApyStats;
  const apyValues = pools.map((p) => p.apy);
  cachedApyStats = { mean: mean(apyValues), std: stdDev(apyValues) };
  return cachedApyStats;
}

/** APY Anomaly: extreme APY is suspicious */
function calcApyAnomaly(pool: DeFiPool, allPools: DeFiPool[]): number {
  const { mean: m, std: sd } = getApyStats(allPools);

  if (sd === 0) return 0;

  const zScore = (pool.apy - m) / sd;

  if (pool.apy > m + 2 * sd) {
    return clamp(Math.abs(zScore) / 5, 0, 1);
  }

  if (pool.apy < 0.1) return 0.3;

  return clamp(Math.abs(zScore) / 5, 0, 0.5);
}

/** Volatility: from enriched data */
function calcVolatility(pool: DeFiPool): number {
  return pool.volatilityProxy;
}

/** Protocol Maturity: known protocols score better */
function calcProtocolMaturity(pool: DeFiPool): number {
  const slug = pool.protocolSlug.toLowerCase();
  const name = pool.protocol.toLowerCase();

  if (MATURE_PROTOCOLS.has(slug) || MATURE_PROTOCOLS.has(name)) {
    return 0.1; // Very low risk
  }
  if (SEMI_MATURE_PROTOCOLS.has(slug) || SEMI_MATURE_PROTOCOLS.has(name)) {
    return 0.4;
  }

  // Unknown protocol — moderate-high risk
  // But if TVL is very high, it's probably established
  if (pool.tvlUsd > 100_000_000) return 0.3;
  if (pool.tvlUsd > 10_000_000) return 0.5;
  if (pool.tvlUsd > 1_000_000) return 0.7;

  return 0.85; // Low TVL + unknown = high risk
}

/** Liquidity Risk: combines TVL depth and IL risk */
function calcLiquidityRisk(pool: DeFiPool): number {
  let risk = pool.liquidityDepthScore; // Already 0-1 where 1 = low TVL (risky)

  // IL risk modifier
  if (pool.ilRisk === 'yes') risk += 0.15;
  else if (pool.ilRisk === 'uncertain') risk += 0.08;

  // Multi-exposure has more liquidity complexity
  if (pool.exposure === 'multi') risk += 0.05;

  return clamp(risk, 0, 1);
}

// --- Risk Category ---

function categorize(score: number): RiskAssessment['category'] {
  if (score < 20) return 'Very Low';
  if (score < 40) return 'Low';
  if (score < 60) return 'Medium';
  if (score < 80) return 'High';
  return 'Very High';
}

// --- Main Risk Assessment ---

/** Assess risk for a single pool in context of all pools */
export function assessRisk(
  pool: DeFiPool,
  allPools: DeFiPool[]
): RiskAssessment {
  const factors: RiskFactors = {
    tvlRisk: calcTvlRisk(pool),
    apyAnomaly: calcApyAnomaly(pool, allPools),
    volatility: calcVolatility(pool),
    protocolMaturity: calcProtocolMaturity(pool),
    liquidityRisk: calcLiquidityRisk(pool),
  };

  const rawScore =
    WEIGHTS.tvlRisk * factors.tvlRisk +
    WEIGHTS.apyAnomaly * factors.apyAnomaly +
    WEIGHTS.volatility * factors.volatility +
    WEIGHTS.protocolMaturity * factors.protocolMaturity +
    WEIGHTS.liquidityRisk * factors.liquidityRisk;

  const score = clamp(Math.round(rawScore * 100), 0, 100);

  // Confidence: based on data quality
  let confidence = 0.8;
  if (pool.tvlUsd < 10_000) confidence -= 0.2;
  if (pool.apyMean30d === 0) confidence -= 0.1;
  if (pool.ilRisk === 'uncertain') confidence -= 0.1;

  return {
    poolId: pool.id,
    score,
    category: categorize(score),
    confidence: clamp(confidence, 0.3, 1),
    factors,
  };
}

/** Assess risk for all pools */
export function assessAllRisks(pools: DeFiPool[]): RiskAssessment[] {
  cachedApyStats = null; // Reset for fresh computation
  const stats = getApyStats(pools); // Pre-compute once
  return pools.map((pool) => assessRisk(pool, pools));
}
