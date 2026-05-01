// ============================================================
// DeFi Yield Optimizer — Core Type Definitions
// ============================================================

// --- Chain & Protocol ---
export type Chain =
  | 'ethereum'
  | 'bsc'
  | 'arbitrum'
  | 'polygon'
  | 'solana'
  | 'base'
  | 'optimism'
  | 'avalanche'
  | 'fantom'
  | 'gnosis'
  | 'celo'
  | 'linea'
  | 'scroll'
  | 'mantle'
  | 'zksync'
  | 'starknet'
  | 'ton'
  | 'sui'
  | 'aptos'
  | 'osmosis'
  | 'cardano'
  | 'berachain'
  | 'sonic'
  | 'hyperliquid'
  | 'katana'
  | 'fraxtal'
  | 'flare';

export interface Protocol {
  name: string;
  slug: string;
  logo?: string;
  category: string;
  chains: Chain[];
}

// --- Pool (normalized) ---
export interface DeFiPool {
  id: string;
  chain: Chain;
  protocol: string;
  protocolSlug: string;
  symbol: string;
  pool: string;               // DefiLlama pool address or id
  tvlUsd: number;
  apy: number;                // normalized APY
  apyBase: number;
  apyReward: number | null;
  apyMean30d: number;
  stablecoin: boolean;
  ilRisk: string;             // 'yes' | 'no' | 'uncertain'
  exposure: string;           // 'single' | 'multi'
  poolMeta: string | null;
  url?: string;
  // Enriched fields
  volatilityProxy: number;    // 0-1
  liquidityDepthScore: number; // 0-1
  stabilityIndicator: number;  // 0-1
}

// --- Risk ---
export interface RiskFactors {
  tvlRisk: number;            // 0-1
  apyAnomaly: number;         // 0-1
  volatility: number;         // 0-1
  protocolMaturity: number;   // 0-1
  liquidityRisk: number;      // 0-1
}

export interface RiskAssessment {
  poolId: string;
  score: number;              // 0-100
  category: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  confidence: number;         // 0-1
  factors: RiskFactors;
}

// --- Simulation ---
export interface SimulationInput {
  capital: number;
  timeHorizonDays: number;
  apy: number;
  riskPreference: 'conservative' | 'balanced' | 'aggressive';
  pool: DeFiPool;
}

export interface SimulationResult {
  expectedReturn: number;
  worstCase: number;
  bestCase: number;
  sharpeLikeRatio: number;
  growthCurve: { day: number; value: number }[];
  impermanentLossEstimate: number;
  gasImpact: number;
  netReturn: number;
}

// --- Strategy ---
export type StrategyMode = 'conservative' | 'balanced' | 'aggressive';

export interface StrategyWeights {
  alpha: number;   // return weight
  beta: number;    // risk weight
  gamma: number;   // stability weight
}

export interface StrategyRanking {
  poolId: string;
  score: number;
  mode: StrategyMode;
  isTrapPool: boolean;
  trapReason?: string;
}

// --- Explanation ---
export interface PoolExplanation {
  poolId: string;
  headline: string;
  insights: string[];
  recommendation: string;
  riskNote: string;
}

// --- User ---
export interface UserPreferences {
  capital: number;
  timeHorizonDays: number;
  strategyMode: StrategyMode;
  selectedChains: Chain[];
  minTvl: number;
  stablecoinOnly: boolean;
}

// --- Yield Alerts ---
export interface YieldAlert {
  id: string;
  poolSymbol: string;
  poolId: string;
  threshold: number;           // APY %
  direction: 'above' | 'below';
  enabled: boolean;
  createdAt: string;           // ISO timestamp
  triggeredAt?: string;        // ISO timestamp when last triggered
}

// --- Saved Simulations ---
export interface SavedSimulation {
  id: string;
  poolSymbol: string;
  poolId: string;
  capital: number;
  days: number;
  riskMode: StrategyMode;
  results: {
    expectedReturn: number;
    worstCase: number;
    bestCase: number;
    sharpeRatio: number;
    netReturn: number;
  };
  timestamp: string;           // ISO timestamp
}

// --- API Response Types ---
export interface DefiLlamaPoolResponse {
  chain: string;
  project: string;
  symbol: string;
  pool: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number | null;
  apyMean30d: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta: string | null;
  mu?: number;
  sigma?: number;
  count?: number;
}

export interface CoinGeckoPriceResponse {
  [coinId: string]: { usd: number };
}
