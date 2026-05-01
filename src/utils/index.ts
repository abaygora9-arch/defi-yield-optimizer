// ============================================================
// Utility Functions
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Math Utilities ---

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Normalize a value from [min, max] to [0, 1] */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/** Log-scale normalization (for TVL etc.) */
export function logNormalize(value: number, min: number, max: number): number {
  if (value <= 0) return 0;
  const logVal = Math.log10(value + 1);
  const logMin = Math.log10(min + 1);
  const logMax = Math.log10(max + 1);
  return normalize(logVal, logMin, logMax);
}

/** Mean of an array */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Standard deviation */
export function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/** Percentile */
export function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

// --- Financial Utilities ---

/** Convert APR to APY (compound daily) */
export function aprToApy(apr: number): number {
  return (1 + apr / 365) ** 365 - 1;
}

/** Compound interest formula */
export function compoundInterest(
  principal: number,
  annualRate: number,
  days: number
): number {
  return principal * (1 + annualRate / 365) ** days;
}

/** Generate random normal (Box-Muller) */
export function randomNormal(mean: number = 0, std: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// --- Formatting ---

/** Format USD */
export function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

/** Format percentage */
export function formatPct(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format number with commas */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// --- Chain Helpers ---

export const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  bsc: '#F0B90B',
  arbitrum: '#28A0F0',
  polygon: '#8247E5',
};

export const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  bsc: 'BNB Chain',
  arbitrum: 'Arbitrum',
  polygon: 'Polygon',
};

// --- Risk Category Colors ---
export const RISK_COLORS: Record<string, string> = {
  'Very Low': '#22C55E',
  'Low': '#84CC16',
  'Medium': '#EAB308',
  'High': '#F97316',
  'Very High': '#EF4444',
};
