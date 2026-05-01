// ============================================================
// Explorer Page — Advanced Pool Database + Search
// ============================================================

'use client';

import { useMemo, useState } from 'react';
import type { DeFiPool, RiskAssessment, StrategyRanking, Chain } from '@/types';
import { Card, Badge } from '@/components/ui';
import { formatUsd, formatPct, CHAIN_LABELS, CHAIN_COLORS, RISK_COLORS } from '@/utils';

interface ExplorerPageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  rankings: StrategyRanking[];
  onSelectPool: (pool: DeFiPool) => void;
}

type SortKey = 'apy' | 'tvl' | 'risk' | 'score' | 'stability';

export function ExplorerPage({ pools, risks, rankings, onSelectPool }: ExplorerPageProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [chainFilter, setChainFilter] = useState<Chain | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);
  const rankMap = useMemo(() => new Map(rankings.map((r) => [r.poolId, r])), [rankings]);

  const filtered = useMemo(() => {
    let result = [...pools];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.symbol.toLowerCase().includes(q) ||
          p.protocol.toLowerCase().includes(q) ||
          p.chain.includes(q)
      );
    }

    // Chain filter
    if (chainFilter !== 'all') {
      result = result.filter((p) => p.chain === chainFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      result = result.filter((p) => {
        const risk = riskMap.get(p.id);
        return risk?.category === riskFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      let va = 0, vb = 0;
      switch (sortKey) {
        case 'apy': va = a.apy; vb = b.apy; break;
        case 'tvl': va = a.tvlUsd; vb = b.tvlUsd; break;
        case 'risk': va = riskMap.get(a.id)?.score ?? 0; vb = riskMap.get(b.id)?.score ?? 0; break;
        case 'score': va = rankMap.get(a.id)?.score ?? 0; vb = rankMap.get(b.id)?.score ?? 0; break;
        case 'stability': va = a.stabilityIndicator; vb = b.stabilityIndicator; break;
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

    return result.slice(0, 100);
  }, [pools, search, chainFilter, riskFilter, sortKey, sortDir, riskMap, rankMap]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="cursor-pointer px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] transition-colors hover:text-white"
      onClick={() => toggleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k && (
          <span className="text-[8px]">{sortDir === 'desc' ? '▼' : '▲'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search & Filters */}
      <div className="glass flex flex-wrap items-center gap-3 p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">⌕</span>
          <input
            type="text"
            placeholder="Search pools, protocols, chains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-black/30 py-2 pl-9 pr-4 text-sm text-white placeholder-[var(--muted-foreground)] outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>

        {/* Chain filter */}
        <select
          value={chainFilter}
          onChange={(e) => setChainFilter(e.target.value as Chain | 'all')}
          className="rounded-lg border border-[var(--glass-border)] bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="all">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="bsc">BNB Chain</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="polygon">Polygon</option>
        </select>

        {/* Risk filter */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="rounded-lg border border-[var(--glass-border)] bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="all">All Risk Levels</option>
          <option value="Very Low">Very Low</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Very High">Very High</option>
        </select>

        <div className="text-xs text-[var(--muted-foreground)]">
          {filtered.length} pools
        </div>
      </div>

      {/* Table */}
      <Card className="glass p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-black/20">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">#</th>
                <SortHeader k="apy" label="Pool" />
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Chain</th>
                <SortHeader k="tvl" label="TVL" />
                <SortHeader k="apy" label="APY" />
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">30d Avg</th>
                <SortHeader k="risk" label="Risk" />
                <SortHeader k="stability" label="Stability" />
                <SortHeader k="score" label="Score" />
                <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pool, i) => {
                const risk = riskMap.get(pool.id);
                const rank = rankMap.get(pool.id);
                return (
                  <tr
                    key={pool.id}
                    onClick={() => pool.url ? window.open(pool.url, '_blank') : onSelectPool(pool)}
                    className="cursor-pointer border-b border-[var(--glass-border)]/30 transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{pool.symbol}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{pool.protocol}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: `${CHAIN_COLORS[pool.chain]}20`, color: CHAIN_COLORS[pool.chain] }}>
                        {CHAIN_LABELS[pool.chain]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{formatUsd(pool.tvlUsd)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[var(--success)]">{formatPct(pool.apy)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-[var(--muted-foreground)]">{formatPct(pool.apyMean30d)}</td>
                    <td className="px-4 py-2.5">
                      {risk && (
                        <Badge variant={risk.score < 30 ? 'success' : risk.score < 60 ? 'warning' : 'danger'}>
                          {risk.score}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="mx-auto h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pool.stabilityIndicator * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-xs font-semibold">{rank?.score.toFixed(3) ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      {rank?.isTrapPool ? (
                        <span className="text-xs">🪤</span>
                      ) : pool.stablecoin ? (
                        <span className="text-xs">🟢</span>
                      ) : (
                        <span className="text-xs">🔵</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-[var(--muted-foreground)]">
            No pools match your search.
          </div>
        )}
      </Card>
    </div>
  );
}
