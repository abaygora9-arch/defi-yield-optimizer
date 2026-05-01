// ============================================================
// Header Bar — with Search + Auto-Refresh
// ============================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { StrategyMode } from '@/types';
import { cn } from '@/utils';

const MODES: { value: StrategyMode; label: string }[] = [
  { value: 'conservative', label: '🛡 Conservative' },
  { value: 'balanced', label: '⚖ Balanced' },
  { value: 'aggressive', label: '⚡ Aggressive' },
];

const REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 300, label: '5min' },
] as const;

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  mode: StrategyMode;
  onModeChange: (m: StrategyMode) => void;
  timestamp?: string;
  /** Global search */
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchResultCount?: number;
  /** Auto-refresh */
  refreshInterval?: number;
  onRefreshIntervalChange?: (seconds: number) => void;
  lastRefreshTime?: string;
}

export function HeaderBar({
  title,
  subtitle,
  mode,
  onModeChange,
  timestamp,
  searchQuery,
  onSearchChange,
  searchResultCount,
  refreshInterval = 0,
  onRefreshIntervalChange,
  lastRefreshTime,
}: HeaderBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery ?? '');
  const [refreshDropdownOpen, setRefreshDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search: 300ms
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange?.(value);
      }, 300);
    },
    [onSearchChange],
  );

  // Sync external search query changes
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== localSearch) {
      setLocalSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close refresh dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (refreshDropdownRef.current && !refreshDropdownRef.current.contains(e.target as Node)) {
        setRefreshDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange?.('');
    setSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Search toggle button */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
            searchOpen
              ? 'bg-[var(--blue-dim)] text-[var(--blue)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-secondary)]'
          )}
          title="Search pools (Ctrl+K)"
        >
          <span className="text-sm">⌕</span>
        </button>

        {/* Search input (expandable) */}
        {searchOpen && (
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search pools, protocols, chains..."
              value={localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 w-[280px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] pl-3 pr-8 text-[12px] text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--blue)]/50 focus:ring-1 focus:ring-[var(--blue)]/30"
            />
            {localSearch && (
              <div className="absolute right-8 flex items-center gap-1">
                <span className="text-[10px] text-[var(--text-muted)]">
                  {searchResultCount ?? 0} results
                </span>
              </div>
            )}
            <button
              onClick={clearSearch}
              className="absolute right-1.5 flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <div>
          <h1 className="text-[15px] font-semibold">{title}</h1>
          {subtitle && <p className="text-[11px] text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Auto-refresh toggle */}
        <div className="relative" ref={refreshDropdownRef}>
          <button
            onClick={() => setRefreshDropdownOpen(!refreshDropdownOpen)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all',
              refreshInterval > 0
                ? 'bg-[var(--green-dim)] text-[var(--green)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-secondary)]'
            )}
          >
            <span
              className={cn(
                'inline-block text-[10px]',
                refreshInterval > 0 && 'animate-spin'
              )}
              style={{ animationDuration: refreshInterval > 0 ? '2s' : undefined }}
            >
              ↻
            </span>
            {refreshInterval > 0 ? `${REFRESH_OPTIONS.find(o => o.value === refreshInterval)?.label ?? refreshInterval + 's'}` : 'Auto'}
          </button>

          {refreshDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] shadow-lg">
              <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Refresh Interval
              </div>
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onRefreshIntervalChange?.(opt.value);
                    setRefreshDropdownOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-[12px] transition-colors',
                    refreshInterval === opt.value
                      ? 'bg-[var(--blue-dim)] text-[var(--blue)]'
                      : 'text-[var(--text-secondary)] hover:bg-white/5'
                  )}
                >
                  <span>{opt.label}</span>
                  {refreshInterval === opt.value && <span>✓</span>}
                </button>
              ))}
              {lastRefreshTime && (
                <div className="border-t border-[var(--border)] px-3 py-2 text-[9px] text-[var(--text-muted)]">
                  Last: {new Date(lastRefreshTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Strategy mode selector */}
        <div className="flex gap-0.5 rounded-lg bg-[var(--bg-primary)] p-0.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onModeChange(m.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[11px] font-medium transition-all',
                mode === m.value
                  ? 'bg-[var(--blue-dim)] text-[var(--blue)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {timestamp && (
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <div className="h-1 w-1 rounded-full bg-[var(--green)]" style={{ animation: 'pulse-soft 2s infinite' }} />
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </header>
  );
}
