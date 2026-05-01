// ============================================================
// Simulation Engine — Monte Carlo + Compound + IL Estimation
// ============================================================

import type { DeFiPool, SimulationInput, SimulationResult } from '@/types';
import { clamp, randomNormal, compoundInterest } from '@/utils';

const SIMULATION_PATHS = 100;
const GAS_COST_USD = 5;           // avg gas per interaction
const REINVEST_FREQUENCY_DAYS = 7; // weekly reinvestment

/** Estimate impermanent loss for a given APY volatility */
function estimateImpermanentLoss(
  volatility: number,
  timeDays: number
): number {
  // Simplified IL model: IL ≈ 0.5 * σ² * t (continuous approximation)
  const annualizedVol = volatility * 0.5; // scaled
  const timeFraction = timeDays / 365;
  const il = 0.5 * annualizedVol ** 2 * timeFraction;
  return clamp(il, 0, 0.3); // Cap at 30%
}

/** Calculate gas impact as % of capital */
function gasImpact(capital: number, reinvestFreqDays: number, timeDays: number): number {
  const interactions = Math.floor(timeDays / reinvestFreqDays);
  const totalGas = interactions * GAS_COST_USD;
  return totalGas / capital;
}

/** Single simulation path with random APY fluctuation */
function simulatePath(
  capital: number,
  baseApy: number,
  volatility: number,
  days: number,
  ilEstimate: number,
  gasCost: number
): number {
  let value = capital;

  for (let d = 1; d <= days; d++) {
    // Daily rate with noise
    const dailyNoise = randomNormal(0, volatility * 0.01);
    const effectiveApy = Math.max(0, baseApy + dailyNoise * baseApy);
    const dailyRate = effectiveApy / 365;

    value *= (1 + dailyRate);

    // Reinvest gas cost weekly
    if (d % REINVEST_FREQUENCY_DAYS === 0) {
      value -= GAS_COST_USD;
    }
  }

  // Apply IL and gas at end
  value *= (1 - ilEstimate);
  value -= gasCost * capital;

  return Math.max(0, value);
}

/** Run Monte Carlo simulation */
export function runSimulation(input: SimulationInput): SimulationResult {
  const { capital, timeHorizonDays, apy, pool } = input;

  // Volatility from pool enrichment
  const volatility = pool.volatilityProxy;

  // Estimate IL
  const ilEstimate = pool.ilRisk === 'yes'
    ? estimateImpermanentLoss(volatility, timeHorizonDays)
    : pool.ilRisk === 'uncertain'
    ? estimateImpermanentLoss(volatility, timeHorizonDays) * 0.3
    : 0;

  // Gas impact
  const gasCost = gasImpact(capital, REINVEST_FREQUENCY_DAYS, timeHorizonDays);

  // Run Monte Carlo paths
  const paths: number[] = [];
  for (let i = 0; i < SIMULATION_PATHS; i++) {
    paths.push(simulatePath(capital, apy, volatility, timeHorizonDays, ilEstimate, gasCost));
  }

  paths.sort((a, b) => a - b);

  const worstCase = paths[Math.floor(SIMULATION_PATHS * 0.05)];  // 5th percentile
  const bestCase = paths[Math.floor(SIMULATION_PATHS * 0.95)];   // 95th percentile
  const expectedReturn = paths.reduce((a, b) => a + b, 0) / SIMULATION_PATHS;

  // Growth curve (expected path, no noise)
  const growthCurve: { day: number; value: number }[] = [];
  let curveValue = capital;
  for (let d = 0; d <= timeHorizonDays; d += Math.max(1, Math.floor(timeHorizonDays / 50))) {
    growthCurve.push({ day: d, value: Math.round(curveValue * 100) / 100 });
    const dailyRate = apy / 365;
    curveValue *= (1 + dailyRate);
  }
  // Final point
  growthCurve.push({ day: timeHorizonDays, value: Math.round(curveValue * 100) / 100 });

  // Net return
  const netReturn = expectedReturn - capital;

  // Sharpe-like ratio (simplified)
  const returns = paths.map((p) => (p - capital) / capital);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const returnStd = Math.sqrt(
    returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length
  );
  const sharpeLikeRatio = returnStd > 0 ? avgReturn / returnStd : 0;

  return {
    expectedReturn: Math.round(expectedReturn * 100) / 100,
    worstCase: Math.round(worstCase * 100) / 100,
    bestCase: Math.round(bestCase * 100) / 100,
    sharpeLikeRatio: Math.round(sharpeLikeRatio * 1000) / 1000,
    growthCurve,
    impermanentLossEstimate: Math.round(ilEstimate * 10000) / 100, // as %
    gasImpact: Math.round(gasCost * 10000) / 100,                  // as %
    netReturn: Math.round(netReturn * 100) / 100,
  };
}
