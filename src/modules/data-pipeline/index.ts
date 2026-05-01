// ============================================================
// Data Pipeline — Main Entry Point
// ============================================================

import type { DeFiPool, Chain } from '@/types';
import { fetchDefiLlamaPools } from './ingestion';
import { normalizePools } from './normalization';
import { enrichPools } from './enrichment';
import { cache } from '@/services/cache';

export interface PipelineOptions {
  chains?: Chain[];
  minTvl?: number;
  stablecoinOnly?: boolean;
}

/** Run the full data pipeline: fetch → normalize → enrich → filter */
export async function runPipeline(
  options: PipelineOptions = {}
): Promise<DeFiPool[]> {
  const { chains, minTvl = 0, stablecoinOnly = false } = options;

  const cacheKey = `pipeline_${chains?.join(',') ?? 'all'}_${minTvl}_${stablecoinOnly}`;
  const cached = cache.get<DeFiPool[]>(cacheKey);
  if (cached) return cached;

  // Stage 1: Ingestion
  const rawPools = await fetchDefiLlamaPools();

  // Stage 2: Normalization
  let pools = normalizePools(rawPools);

  // Stage 3: Filtering
  if (chains && chains.length > 0) {
    pools = pools.filter((p) => chains.includes(p.chain));
  }
  if (minTvl > 0) {
    pools = pools.filter((p) => p.tvlUsd >= minTvl);
  }
  if (stablecoinOnly) {
    pools = pools.filter((p) => p.stablecoin);
  }

  // Stage 4: Enrichment
  pools = enrichPools(pools);

  cache.set(cacheKey, pools, 3 * 60 * 1000); // 3 min
  return pools;
}

// Re-export sub-modules
export { fetchDefiLlamaPools, fetchTokenPrices } from './ingestion';
export { normalizePools } from './normalization';
export { enrichPools } from './enrichment';
