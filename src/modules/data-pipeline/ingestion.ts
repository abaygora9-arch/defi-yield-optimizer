// ============================================================
// Data Pipeline — Ingestion from DefiLlama + CoinGecko
// ============================================================

import type { DefiLlamaPoolResponse, CoinGeckoPriceResponse } from '@/types';
import { cache } from '@/services/cache';

const DEFILLAMA_API = 'https://yields.llama.fi/pools';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/** Fetch all yield pools from DefiLlama */
export async function fetchDefiLlamaPools(): Promise<DefiLlamaPoolResponse[]> {
  const cacheKey = 'defillama_pools';
  const cached = cache.get<DefiLlamaPoolResponse[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(DEFILLAMA_API, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 }, // 5 min ISR
  });

  if (!res.ok) {
    throw new Error(`DefiLlama API error: ${res.status}`);
  }

  const json = await res.json();
  const pools: DefiLlamaPoolResponse[] = json.data ?? [];

  cache.set(cacheKey, pools, 5 * 60 * 1000);
  return pools;
}

/** Fetch token prices from CoinGecko (batch) */
export async function fetchTokenPrices(
  coinIds: string[]
): Promise<CoinGeckoPriceResponse> {
  if (coinIds.length === 0) return {};

  const cacheKey = `prices_${coinIds.sort().join(',')}`;
  const cached = cache.get<CoinGeckoPriceResponse>(cacheKey);
  if (cached) return cached;

  const ids = coinIds.join(',');
  const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.warn(`CoinGecko API error: ${res.status}, using fallback`);
    return {};
  }

  const data: CoinGeckoPriceResponse = await res.json();
  cache.set(cacheKey, data, 60 * 1000);
  return data;
}
