// ============================================================
// Dashboard — Filters Bar
// ============================================================

'use client';

import type { Chain, StrategyMode } from '@/types';
import { Button, Toggle } from '@/components/ui';
import { CHAIN_LABELS } from '@/utils';
import type { Filters } from '@/hooks/useData';

const ALL_CHAINS: Chain[] = [
  'ethereum', 'bsc', 'arbitrum', 'polygon', 'solana', 'base', 'optimism',
  'avalanche', 'fantom', 'gnosis', 'celo', 'linea', 'scroll', 'mantle',
  'zksync', 'starknet', 'ton', 'sui', 'aptos', 'osmosis', 'cardano',
  'berachain', 'sonic', 'hyperliquid', 'katana', 'fraxtal', 'flare',
];
const MODES: { value: StrategyMode; label: string; emoji: string }[] = [
  { value: 'conservative', label: 'Conservative', emoji: '🛡️' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
  { value: 'aggressive', label: 'Aggressive', emoji: '🔥' },
];

interface FiltersBarProps {
  filters: Filters;
  onUpdate: (patch: Partial<Filters>) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function FiltersBar({
  filters,
  onUpdate,
  onRefresh,
  loading,
}: FiltersBarProps) {
  const toggleChain = (chain: Chain) => {
    const current = filters.chains;
    const next = current.includes(chain)
      ? current.filter((c) => c !== chain)
      : [...current, chain];
    onUpdate({ chains: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Strategy Mode */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => onUpdate({ mode: m.value })}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.mode === m.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Chain Filters */}
      <div className="flex gap-2">
        {ALL_CHAINS.map((chain) => (
          <button
            key={chain}
            onClick={() => toggleChain(chain)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filters.chains.includes(chain)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {CHAIN_LABELS[chain]}
          </button>
        ))}
      </div>

      {/* Stablecoin Toggle */}
      <Toggle
        checked={filters.stablecoinOnly}
        onChange={(v) => onUpdate({ stablecoinOnly: v })}
        label="Stablecoins only"
      />

      {/* Min TVL */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Min TVL:</span>
        <select
          value={filters.minTvl}
          onChange={(e) => onUpdate({ minTvl: Number(e.target.value) })}
          className="rounded-md border border-border bg-card px-2 py-1 text-sm"
        >
          <option value={0}>Any</option>
          <option value={10000}>$10K+</option>
          <option value={100000}>$100K+</option>
          <option value={1000000}>$1M+</option>
          <option value={10000000}>$10M+</option>
        </select>
      </div>

      {/* Refresh */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? '⏳ Loading...' : '🔄 Refresh'}
      </Button>
    </div>
  );
}
