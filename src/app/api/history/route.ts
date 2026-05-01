// ============================================================
// API Route — Pool History (APY + TVL over time)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/services/cache';

const DEFILLAMA_CHART = 'https://yields.llama.fi/chart';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const poolId = searchParams.get('poolId');

    if (!poolId) {
      return NextResponse.json({ error: 'poolId required' }, { status: 400 });
    }

    const cacheKey = `history_${poolId}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const res = await fetch(`${DEFILLAMA_CHART}/${poolId}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 600 }, // 10 min
    });

    if (!res.ok) {
      return NextResponse.json({ error: `DefiLlama error: ${res.status}` }, { status: res.status });
    }

    const json = await res.json();
    const data = json.data ?? [];

    // Process: daily samples, compute stats
    const processed = data.map((d: { timestamp: string; apy: number; tvlUsd: number }) => ({
      date: d.timestamp.split('T')[0],
      apy: d.apy,
      tvl: d.tvlUsd,
    }));

    // Stats
    const apyValues = processed.map((d: { apy: number }) => d.apy).filter((v: number) => v > 0);
    const stats = {
      minApy: Math.min(...apyValues),
      maxApy: Math.max(...apyValues),
      avgApy: apyValues.reduce((a: number, b: number) => a + b, 0) / apyValues.length,
      currentApy: processed[processed.length - 1]?.apy ?? 0,
      dataPoints: processed.length,
      firstDate: processed[0]?.date,
      lastDate: processed[processed.length - 1]?.date,
    };

    const result = { history: processed, stats };
    cache.set(cacheKey, result, 10 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
