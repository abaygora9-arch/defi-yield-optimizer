// ============================================================
// API Route — DeFi Pools (increased default limit)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { Chain } from '@/types';
import { runPipeline } from '@/modules/data-pipeline';
import { assessAllRisks } from '@/modules/risk-engine';
import { rankPools, getTopPools } from '@/modules/strategy';
import type { StrategyMode } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const chainsParam = searchParams.get('chains');
    const chains: Chain[] | undefined = chainsParam ? (chainsParam.split(',') as Chain[]) : undefined;
    const minTvl = Number(searchParams.get('minTvl')) || 0;
    const stablecoinOnly = searchParams.get('stablecoin') === 'true';
    const mode = (searchParams.get('mode') as StrategyMode) || 'balanced';
    const limit = Number(searchParams.get('limit')) || 200; // Increased default

    const pools = await runPipeline({ chains, minTvl, stablecoinOnly });
    const risks = assessAllRisks(pools);
    const rankings = rankPools(pools, risks, mode);
    const topPools = getTopPools(rankings, limit);

    const topPoolIds = new Set(topPools.map((r) => r.poolId));
    const topPoolData = pools.filter((p) => topPoolIds.has(p.id));

    // Chain breakdown
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

    return NextResponse.json({
      pools: topPoolData,
      risks: risks.filter((r) => topPoolIds.has(r.poolId)),
      rankings: topPools,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool data', details: String(error) }, { status: 500 });
  }
}
