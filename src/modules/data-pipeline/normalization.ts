// ============================================================
// Data Pipeline — Normalization Engine
// ============================================================

import type { Chain, DeFiPool, DefiLlamaPoolResponse } from '@/types';
import { clamp, aprToApy } from '@/utils';

const SUPPORTED_CHAINS: Chain[] = [
  'ethereum', 'bsc', 'arbitrum', 'polygon', 'solana', 'base', 'optimism',
  'avalanche', 'fantom', 'gnosis', 'celo', 'linea', 'scroll', 'mantle',
  'zksync', 'starknet', 'ton', 'sui', 'aptos', 'osmosis', 'cardano',
  'berachain', 'sonic', 'hyperliquid', 'katana', 'fraxtal', 'flare',
  'megaeth', 'ink',
];

const CHAIN_MAP: Record<string, Chain> = {
  Ethereum: 'ethereum',
  BSC: 'bsc',
  Binance: 'bsc',
  'BNB Chain': 'bsc',
  Arbitrum: 'arbitrum',
  Polygon: 'polygon',
  Solana: 'solana',
  Base: 'base',
  'OP Mainnet': 'optimism',
  Optimism: 'optimism',
  Avalanche: 'avalanche',
  Fantom: 'fantom',
  Gnosis: 'gnosis',
  Celo: 'celo',
  Linea: 'linea',
  Scroll: 'scroll',
  Mantle: 'mantle',
  zkSync: 'zksync',
  Starknet: 'starknet',
  TON: 'ton',
  Sui: 'sui',
  Aptos: 'aptos',
  Osmosis: 'osmosis',
  Cardano: 'cardano',
  Berachain: 'berachain',
  Sonic: 'sonic',
  'Hyperliquid L1': 'hyperliquid',
  Hyperliquid: 'hyperliquid',
  Katana: 'katana',
  Fraxtal: 'fraxtal',
  Flare: 'flare',
  MegaETH: 'megaeth',
  Ink: 'ink',
};

/** Map DefiLlama chain string to our Chain type */
function mapChain(raw: string): Chain | null {
  return CHAIN_MAP[raw] ?? null;
}

/** Check if a pool is valid for our analysis */
function isValidPool(pool: DefiLlamaPoolResponse): boolean {
  if (!pool.chain || !pool.project || !pool.symbol) return false;
  if (typeof pool.tvlUsd !== 'number' || pool.tvlUsd < 0) return false;
  if (typeof pool.apy !== 'number' || !isFinite(pool.apy)) return false;
  if (pool.apy > 10000) return false; // Extreme outlier
  return true;
}

/** Normalize raw DefiLlama pools to our DeFiPool format */
export function normalizePools(rawPools: DefiLlamaPoolResponse[]): DeFiPool[] {
  return rawPools
    .filter((p) => {
      const chain = mapChain(p.chain);
      return chain !== null && isValidPool(p);
    })
    .map((p) => {
      const chain = mapChain(p.chain)!;

      // Normalize APY: if base APY is provided and reasonable, use it
      // Otherwise use the total APY
      let apy = p.apy;
      if (apy < 0) apy = 0;

      // APY mean 30d — fallback to current APY if missing
      const apyMean30d = typeof p.apyMean30d === 'number' && isFinite(p.apyMean30d)
        ? Math.max(0, p.apyMean30d)
        : apy;

      return {
        id: p.pool,
        chain,
        protocol: p.project,
        protocolSlug: p.project.toLowerCase().replace(/\s+/g, '-'),
        symbol: p.symbol,
        pool: p.pool,
        tvlUsd: Math.max(0, p.tvlUsd),
        apy: clamp(apy, 0, 10000),
        apyBase: typeof p.apyBase === 'number' ? clamp(p.apyBase, 0, 10000) : 0,
        apyReward: typeof p.apyReward === 'number' ? clamp(p.apyReward, 0, 10000) : null,
        apyMean30d: clamp(apyMean30d, 0, 10000),
        stablecoin: Boolean(p.stablecoin),
        ilRisk: p.ilRisk ?? 'uncertain',
        exposure: p.exposure ?? 'single',
        poolMeta: p.poolMeta ?? null,
        url: `https://defillama.com/yields/pool/${p.pool}`,
        volatilityProxy: 0,      // enriched later
        liquidityDepthScore: 0,  // enriched later
        stabilityIndicator: 0,   // enriched later
      };
    });
}
