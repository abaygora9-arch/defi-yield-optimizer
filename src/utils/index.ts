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
  solana: '#9945FF',
  base: '#0052FF',
  optimism: '#FF0420',
  avalanche: '#E84142',
  fantom: '#1969FF',
  gnosis: '#04795B',
  celo: '#FCFF52',
  linea: '#61D1FA',
  scroll: '#FFEEDA',
  mantle: '#000000',
  zksync: '#4E529A',
  starknet: '#F5A623',
  ton: '#0098EA',
  sui: '#6FBCF0',
  aptos: '#2DD8A3',
  osmosis: '#5E12A0',
  cardano: '#0033AD',
  berachain: '#FFC107',
  sonic: '#FF6B35',
  hyperliquid: '#00D4AA',
  katana: '#FF4500',
  fraxtal: '#000000',
  flare: '#E63946',
  megaeth: '#FF6B00',
  ink: '#000000',
};

export const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  bsc: 'BNB Chain',
  arbitrum: 'Arbitrum',
  polygon: 'Polygon',
  solana: 'Solana',
  base: 'Base',
  optimism: 'Optimism',
  avalanche: 'Avalanche',
  fantom: 'Fantom',
  gnosis: 'Gnosis',
  celo: 'Celo',
  linea: 'Linea',
  scroll: 'Scroll',
  mantle: 'Mantle',
  zksync: 'zkSync',
  starknet: 'Starknet',
  ton: 'TON',
  sui: 'Sui',
  aptos: 'Aptos',
  osmosis: 'Osmosis',
  cardano: 'Cardano',
  berachain: 'Berachain',
  sonic: 'Sonic',
  hyperliquid: 'Hyperliquid',
  katana: 'Katana',
  fraxtal: 'Fraxtal',
  flare: 'Flare',
  megaeth: 'MegaETH',
  ink: 'Ink',
};

// --- Risk Category Colors ---
export const RISK_COLORS: Record<string, string> = {
  'Very Low': '#22C55E',
  'Low': '#84CC16',
  'Medium': '#EAB308',
  'High': '#F97316',
  'Very High': '#EF4444',
};

// --- Export Utilities ---

/** Trigger a client-side file download */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Escape a CSV field (wrap in quotes if it contains comma/quote/newline) */
function escapeCsvField(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Export pool data as CSV string */
export function exportPoolsToCsv(
  pools: import('@/types').DeFiPool[],
  risks: import('@/types').RiskAssessment[],
): string {
  const riskMap = new Map(risks.map((r) => [r.poolId, r]));
  const header = 'Symbol,Protocol,Chain,TVL,APY,30d Avg,Risk Score,Risk Category';
  const rows = pools.map((pool) => {
    const risk = riskMap.get(pool.id);
    return [
      escapeCsvField(pool.symbol),
      escapeCsvField(pool.protocol),
      escapeCsvField(pool.chain),
      escapeCsvField(pool.tvlUsd),
      escapeCsvField(pool.apy),
      escapeCsvField(pool.apyMean30d),
      escapeCsvField(risk?.score ?? ''),
      escapeCsvField(risk?.category ?? ''),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

/** Export pool data as JSON string */
export function exportPoolsToJson(
  pools: import('@/types').DeFiPool[],
  risks: import('@/types').RiskAssessment[],
): string {
  const riskMap = new Map(risks.map((r) => [r.poolId, r]));
  const data = pools.map((pool) => ({
    ...pool,
    risk: riskMap.get(pool.id) ?? null,
  }));
  return JSON.stringify(data, null, 2);
}

/** Debounce utility */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
  };
  return debounced as T & { cancel: () => void };
}
