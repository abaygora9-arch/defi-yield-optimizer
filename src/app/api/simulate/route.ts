// ============================================================
// API Route — Simulation Engine
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { DeFiPool, SimulationInput } from '@/types';
import { runSimulation } from '@/modules/simulation';
import { explainPool } from '@/modules/explanation';
import { assessRisk } from '@/modules/risk-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { capital, timeHorizonDays, pool, mode } = body as {
      capital: number;
      timeHorizonDays: number;
      pool: DeFiPool;
      mode: 'conservative' | 'balanced' | 'aggressive';
    };

    if (!capital || !timeHorizonDays || !pool) {
      return NextResponse.json(
        { error: 'Missing required fields: capital, timeHorizonDays, pool' },
        { status: 400 }
      );
    }

    const input: SimulationInput = {
      capital,
      timeHorizonDays,
      apy: pool.apy,
      riskPreference: mode || 'balanced',
      pool,
    };

    const simulation = runSimulation(input);
    const risk = assessRisk(pool, [pool]);
    const explanation = explainPool(pool, risk, simulation);

    return NextResponse.json({
      simulation,
      risk,
      explanation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Simulation API Error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', details: String(error) },
      { status: 500 }
    );
  }
}
