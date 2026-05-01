// ============================================================
// Data Pipeline — Main Entry Point (with heavy caching)
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

// Global cache for ALL enriched pools (shared across all requests)
let globalEnrichedPools: DeFiPool[] | null = null;
let globalCacheTime = 0;
const GLOBAL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/** Get or build the global enriched pool cache */
async function getGlobalPools(): Promise<DeFiPool[]> {
  const now = Date.now();
  if (globalEnrichedPools && (now - globalCacheTime) < GLOBAL_CACHE_TTL) {
    return globalEnrichedPools;
  }

  console.time('pipeline-fetch');
  const rawPools = await fetchDefiLlamaPools();
  console.timeEnd('pipeline-fetch');

  console.time('pipeline-normalize');
  const normalized = normalizePools(rawPools);
  console.timeEnd('pipeline-normalize');

  console.time('pipeline-enrich');
  const enriched = enrichPools(normalized);
  console.timeEnd('pipeline-enrich');

  globalEnrichedPools = enriched;
  globalCacheTime = now;
  console.log(`[Pipeline] Cached ${enriched.length} pools globally`);
  return enriched;
}

/** Run the full data pipeline: fetch → normalize → enrich → filter */
export async function runPipeline(
  options: PipelineOptions = {}
): Promise<DeFiPool[]> {
  const { chains, minTvl = 0, stablecoinOnly = false } = options;

  // Get all enriched pools from global cache
  let pools = await getGlobalPools();

  // Filter (cheap - just array filter on cached data)
  if (chains && chains.length > 0) {
    pools = pools.filter((p) => chains.includes(p.chain));
  }
  if (minTvl > 0) {
    pools = pools.filter((p) => p.tvlUsd >= minTvl);
  }
  if (stablecoinOnly) {
    pools = pools.filter((p) => p.stablecoin);
  }

  return pools;
}

// Re-export sub-modules
export { fetchDefiLlamaPools, fetchTokenPrices } from './ingestion';
export { normalizePools } from './normalization';
export { enrichPools } from './enrichment';
