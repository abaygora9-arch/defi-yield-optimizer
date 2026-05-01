// ============================================================
// Watchlist Page — Wallet-aware persistence
// ============================================================

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DeFiPool, RiskAssessment } from '@/types';
import { formatUsd, formatPct, CHAIN_LABELS, CHAIN_COLORS } from '@/utils';
import { useWallet } from '@/services/wallet';

interface WatchlistPageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
}

function getStorageKey(address: string | null): string {
  return address ? `defi_watchlist_${address.toLowerCase()}` : 'defi_watchlist_guest';
}

function loadWatchlist(address: string | null): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKey(address);
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveWatchlist(address: string | null, ids: string[]) {
  const key = getStorageKey(address);
  localStorage.setItem(key, JSON.stringify(ids));
}

export function WatchlistPage({ pools, risks }: WatchlistPageProps) {
  const { address, isConnected } = useWallet();
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'apy' | 'risk' | 'tvl'>('apy');
  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);

  // Reload watchlist when wallet changes
  useEffect(() => {
    setWatchedIds(loadWatchlist(address));
  }, [address]);

  const toggleWatch = useCallback((id: string) => {
    setWatchedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id];
      saveWatchlist(address, next);
      return next;
    });
  }, [address]);

  // Migrate guest watchlist to wallet
  const migrateGuestWatchlist = useCallback(() => {
    if (!isConnected || !address) return;
    const guestList = loadWatchlist(null);
    const walletList = loadWatchlist(address);
    // Merge without duplicates
    const merged = [...new Set([...walletList, ...guestList])];
    saveWatchlist(address, merged);
    setWatchedIds(merged);
    // Clear guest list
    localStorage.removeItem('defi_watchlist_guest');
  }, [address, isConnected]);

  // Auto-migrate on first wallet connection
  useEffect(() => {
    if (isConnected && address) {
      const guestList = loadWatchlist(null);
      if (guestList.length > 0) {
        migrateGuestWatchlist();
      }
    }
  }, [isConnected, address, migrateGuestWatchlist]);

  const watchedPools = useMemo(() => {
    return watchedIds
      .map((id) => pools.find((p) => p.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) return 0;
        switch (sortBy) {
          case 'apy': return b.apy - a.apy;
          case 'tvl': return b.tvlUsd - a.tvlUsd;
          case 'risk': {
            const ra = riskMap.get(a.id)?.score ?? 0;
            const rb = riskMap.get(b.id)?.score ?? 0;
            return ra - rb;
          }
          default: return 0;
        }
      }) as DeFiPool[];
  }, [watchedIds, pools, sortBy, riskMap]);

  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return pools
      .filter((p) => !watchedIds.includes(p.id))
      .filter((p) => p.symbol.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q))
      .slice(0, 10);
  }, [pools, search, watchedIds]);

  const summary = useMemo(() => {
    if (watchedPools.length === 0) return null;
    const avgApy = watchedPools.reduce((s, p) => s + p.apy, 0) / watchedPools.length;
    const avgRisk = watchedPools.reduce((s, p) => s + (riskMap.get(p.id)?.score ?? 0), 0) / watchedPools.length;
    const totalTvl = watchedPools.reduce((s, p) => s + p.tvlUsd, 0);
    return { count: watchedPools.length, avgApy, avgRisk, totalTvl };
  }, [watchedPools, riskMap]);

  return (
    <div className="space-y-5 animate-in">
      {/* Wallet Status */}
      {isConnected ? (
        <div className="panel flex items-center gap-3 bg-[var(--green-dim)] p-3">
          <div className="h-2 w-2 rounded-full bg-[var(--green)]" />
          <div className="text-[11px]">
            <span className="text-[var(--green)]">Wallet connected</span>
            <span className="text-[var(--text-muted)]"> — watchlist saved to your wallet address</span>
          </div>
        </div>
      ) : (
        <div className="panel flex items-center gap-3 bg-[var(--amber-dim)] p-3">
          <div className="h-2 w-2 rounded-full bg-[var(--amber)]" />
          <div className="text-[11px]">
            <span className="text-[var(--amber)]">No wallet connected</span>
            <span className="text-[var(--text-muted)]"> — watchlist saved locally. Connect wallet to persist across devices.</span>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="panel p-4" style={{ borderLeft: '3px solid var(--blue)' }}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Watching</div>
            <div className="mt-1 text-[22px] font-bold text-[var(--blue)]">{summary.count}</div>
          </div>
          <div className="panel p-4" style={{ borderLeft: '3px solid var(--green)' }}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Avg APY</div>
            <div className="mt-1 text-[22px] font-bold text-[var(--green)]">{formatPct(summary.avgApy)}</div>
          </div>
          <div className="panel p-4" style={{ borderLeft: '3px solid var(--amber)' }}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Avg Risk</div>
            <div className="mt-1 text-[22px] font-bold text-[var(--amber)]">{summary.avgRisk.toFixed(1)}</div>
          </div>
          <div className="panel p-4" style={{ borderLeft: '3px solid var(--purple)' }}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Total TVL</div>
            <div className="mt-1 text-[22px] font-bold text-[var(--purple)]">{formatUsd(summary.totalTvl)}</div>
          </div>
        </div>
      )}

      {/* Add pools */}
      <div className="panel p-4">
        <div className="mb-3 text-[12px] font-semibold">Add to Watchlist</div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">⌕</span>
          <input
            type="text"
            placeholder="Search pools to watch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-[12px] outline-none focus:border-[var(--blue)]/50"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {searchResults.map((pool) => (
              <div
                key={pool.id}
                onClick={() => { toggleWatch(pool.id); setSearch(''); }}
                className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[11px] hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: CHAIN_COLORS[pool.chain] }} />
                  <span className="font-medium">{pool.symbol}</span>
                  <span className="text-[var(--text-muted)]">{pool.protocol} · {CHAIN_LABELS[pool.chain]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--green)]">{formatPct(pool.apy)}</span>
                  <span className="text-[var(--blue)]">+ Watch</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist Table */}
      <div className="panel p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div className="text-[12px] font-semibold">★ Your Watchlist ({watchedPools.length})</div>
          <div className="flex gap-1">
            {(['apy', 'risk', 'tvl'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                  sortBy === s ? 'bg-[var(--blue-dim)] text-[var(--blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {watchedPools.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-[12px] text-[var(--text-muted)]">
            No pools in watchlist. Search above to add.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {watchedPools.map((pool) => {
              const risk = riskMap.get(pool.id);
              return (
                <div key={pool.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleWatch(pool.id)}
                      className="text-[var(--amber)] hover:text-[var(--red)] text-[14px]"
                    >
                      ★
                    </button>
                    <div className="h-2 w-2 rounded-full" style={{ background: CHAIN_COLORS[pool.chain] }} />
                    <div>
                      <div className="text-[12px] font-medium">{pool.symbol}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {pool.protocol} · {CHAIN_LABELS[pool.chain]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[13px] font-bold font-mono text-[var(--green)]">{formatPct(pool.apy)}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">30d: {formatPct(pool.apyMean30d)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-mono">{formatUsd(pool.tvlUsd)}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">TVL</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[12px] font-mono font-semibold ${
                        (risk?.score ?? 0) < 30 ? 'text-[var(--green)]' :
                        (risk?.score ?? 0) < 60 ? 'text-[var(--amber)]' :
                        'text-[var(--red)]'
                      }`}>
                        {risk?.score ?? '—'}
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)]">Risk</div>
                    </div>
                    {pool.url && (
                      <a href={pool.url} target="_blank" rel="noopener noreferrer"
                        className="rounded-md bg-[var(--blue-dim)] px-2 py-1 text-[10px] text-[var(--blue)] hover:bg-[var(--blue)]/20">
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
