// ============================================================
// API Route — DeFi Pools (with response caching)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { Chain, StrategyMode } from '@/types';
import { runPipeline } from '@/modules/data-pipeline';
import { assessAllRisks } from '@/modules/risk-engine';
import { rankPools, getTopPools } from '@/modules/strategy';

// Response-level cache (risk + ranking are CPU-heavy)
const responseCache = new Map<string, { data: unknown; time: number }>();
const RESPONSE_TTL = 5 * 60 * 1000; // 5 min

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const chainsParam = searchParams.get('chains');
    const chains: Chain[] | undefined = chainsParam ? (chainsParam.split(',') as Chain[]) : undefined;
    const minTvl = Number(searchParams.get('minTvl')) || 0;
    const stablecoinOnly = searchParams.get('stablecoin') === 'true';
    const mode = (searchParams.get('mode') as StrategyMode) || 'balanced';
    const limit = Number(searchParams.get('limit')) || 200;

    const cacheKey = `${chains?.join(',') ?? 'all'}_${minTvl}_${stablecoinOnly}_${mode}_${limit}`;
    const now = Date.now();
    const cached = responseCache.get(cacheKey);
    if (cached && (now - cached.time) < RESPONSE_TTL) {
      return NextResponse.json(cached.data);
    }

    console.time('api-pipeline');
    const pools = await runPipeline({ chains, minTvl, stablecoinOnly });
    console.timeEnd('api-pipeline');

    console.time('api-risk');
    const risks = assessAllRisks(pools);
    console.timeEnd('api-risk');

    console.time('api-rank');
    const rankings = rankPools(pools, risks, mode);
    const topPools = getTopPools(rankings, limit);
    console.timeEnd('api-rank');

    const topPoolIds = new Set(topPools.map((r) => r.poolId));
    const topPoolData = pools.filter((p) => topPoolIds.has(p.id));

    const chainBreakdown: Record<string, number> = {};
    pools.forEach((p) => { chainBreakdown[p.chain] = (chainBreakdown[p.chain] || 0) + 1; });

    const stats = {
      totalPools: pools.length,
      avgApy: pools.length > 0 ? pools.reduce((s, p) => s + p.apy, 0) / pools.length : 0,
      avgRisk: risks.length > 0 ? risks.reduce((s, r) => s + r.score, 0) / risks.length : 0,
      trapPools: rankings.filter((r) => r.isTrapPool).length,
      chains: [...new Set(pools.map((p) => p.chain))],
      chainBreakdown,
    };

    const result = {
      pools: topPoolData,
      risks: risks.filter((r) => topPoolIds.has(r.poolId)),
      rankings: topPools,
      stats,
      timestamp: new Date().toISOString(),
    };

    responseCache.set(cacheKey, { data: result, time: now });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool data', details: String(error) }, { status: 500 });
  }
}
