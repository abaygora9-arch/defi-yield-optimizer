// ============================================================
// Alert Manager — Yield APY Threshold Alerts
// ============================================================

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DeFiPool, RiskAssessment, YieldAlert } from '@/types';
import { formatPct, CHAIN_LABELS, CHAIN_COLORS } from '@/utils';
import { Card } from '@/components/ui';

interface AlertManagerProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  onAlertCountChange?: (count: number) => void;
}

const STORAGE_KEY = 'defi_yield_alerts';

function loadAlerts(): YieldAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAlerts(alerts: YieldAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function generateId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function AlertManager({ pools, risks, onAlertCountChange }: AlertManagerProps) {
  const [alerts, setAlerts] = useState<YieldAlert[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [threshold, setThreshold] = useState(10);
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);

  // Load alerts on mount
  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  // Search results for pool picker
  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return pools
      .filter((p) => p.symbol.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q))
      .slice(0, 10);
  }, [pools, search]);

  // Check alerts against current pool data
  useEffect(() => {
    if (alerts.length === 0) {
      onAlertCountChange?.(0);
      return;
    }

    const nowTriggered = new Set<string>();
    let count = 0;

    alerts.forEach((alert) => {
      if (!alert.enabled) return;
      const pool = pools.find((p) => p.id === alert.poolId);
      if (!pool) return;

      const isTriggered =
        (alert.direction === 'above' && pool.apy >= alert.threshold) ||
        (alert.direction === 'below' && pool.apy <= alert.threshold);

      if (isTriggered && !dismissedIds.has(alert.id)) {
        nowTriggered.add(alert.id);
        count++;
      }
    });

    setTriggeredIds(nowTriggered);
    onAlertCountChange?.(count);
  }, [alerts, pools, dismissedIds, onAlertCountChange]);

  const addAlert = useCallback(() => {
    if (!selectedPoolId) return;
    const pool = pools.find((p) => p.id === selectedPoolId);
    if (!pool) return;

    const newAlert: YieldAlert = {
      id: generateId(),
      poolSymbol: pool.symbol,
      poolId: pool.id,
      threshold,
      direction,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    setAlerts((prev) => {
      const next = [...prev, newAlert];
      saveAlerts(next);
      return next;
    });

    setSearch('');
    setSelectedPoolId('');
    setThreshold(10);
  }, [selectedPoolId, threshold, direction, pools]);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
      saveAlerts(next);
      return next;
    });
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAlerts(next);
      return next;
    });
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Mark as triggered
    setAlerts((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, triggeredAt: new Date().toISOString() } : a
      );
      saveAlerts(next);
      return next;
    });
  }, []);

  const activeAlertCount = alerts.filter((a) => a.enabled).length;
  const triggeredCount = triggeredIds.size;

  return (
    <div className="space-y-5 animate-in">
      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="panel p-4" style={{ borderLeft: '3px solid var(--blue)' }}>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Total Alerts</div>
          <div className="mt-1 text-[22px] font-bold text-[var(--blue)]">{alerts.length}</div>
        </div>
        <div className="panel p-4" style={{ borderLeft: '3px solid var(--green)' }}>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Active</div>
          <div className="mt-1 text-[22px] font-bold text-[var(--green)]">{activeAlertCount}</div>
        </div>
        <div className="panel p-4" style={{ borderLeft: '3px solid var(--amber)' }}>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Triggered</div>
          <div className="mt-1 text-[22px] font-bold text-[var(--amber)]">{triggeredCount}</div>
        </div>
        <div className="panel p-4" style={{ borderLeft: '3px solid var(--purple)' }}>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Dismissed</div>
          <div className="mt-1 text-[22px] font-bold text-[var(--purple)]">{dismissedIds.size}</div>
        </div>
      </div>

      {/* Triggered Alerts Banner */}
      {triggeredCount > 0 && (
        <div className="panel bg-[var(--amber-dim)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--amber)]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--amber)] text-[10px] font-bold text-black">
              {triggeredCount}
            </span>
            Alert{triggeredCount > 1 ? 's' : ''} Triggered
          </div>
          <div className="space-y-1">
            {alerts
              .filter((a) => triggeredIds.has(a.id))
              .map((alert) => {
                const pool = pools.find((p) => p.id === alert.poolId);
                return (
                  <div key={alert.id} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-[11px]">
                    <div>
                      <span className="font-medium text-[var(--amber)]">{alert.poolSymbol}</span>
                      <span className="text-[var(--text-muted)]">
                        {' '}APY {alert.direction === 'above' ? '≥' : '≤'} {formatPct(alert.threshold)}
                        {' → now '}
                        <span className="font-mono text-[var(--green)]">{pool ? formatPct(pool.apy) : '—'}</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="rounded-md bg-[var(--amber)]/20 px-2 py-1 text-[10px] text-[var(--amber)] hover:bg-[var(--amber)]/30"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="rounded-md bg-[var(--red)]/20 px-2 py-1 text-[10px] text-[var(--red)] hover:bg-[var(--red)]/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Create Alert */}
      <div className="panel p-4">
        <div className="mb-3 text-[12px] font-semibold">Create New Alert</div>

        {/* Pool Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">⌕</span>
          <input
            type="text"
            placeholder="Search pools..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedPoolId(''); }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] py-2 pl-9 pr-3 text-[12px] outline-none focus:border-[var(--blue)]/50"
          />
        </div>

        {searchResults.length > 0 && !selectedPoolId && (
          <div className="mb-3 space-y-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-1">
            {searchResults.map((pool) => (
              <div
                key={pool.id}
                onClick={() => { setSelectedPoolId(pool.id); setSearch(pool.symbol); }}
                className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[11px] hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: CHAIN_COLORS[pool.chain] }} />
                  <span className="font-medium">{pool.symbol}</span>
                  <span className="text-[var(--text-muted)]">{pool.protocol} · {CHAIN_LABELS[pool.chain]}</span>
                </div>
                <span className="font-mono text-[var(--green)]">{formatPct(pool.apy)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Threshold Config */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Direction
            </label>
            <div className="flex gap-1">
              {(['above', 'below'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-all ${
                    direction === d
                      ? d === 'above'
                        ? 'bg-[var(--green-dim)] text-[var(--green)] ring-1 ring-[var(--green)]/30'
                        : 'bg-[var(--red-dim)] text-[var(--red)] ring-1 ring-[var(--red)]/30'
                      : 'bg-white/[0.03] text-[var(--text-muted)] hover:bg-white/[0.06]'
                  }`}
                >
                  {d === 'above' ? '↑ Above' : '↓ Below'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              APY Threshold (%)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              step={0.5}
              min={0}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-[12px] outline-none focus:border-[var(--blue)]/50"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addAlert}
              disabled={!selectedPoolId}
              className="w-full rounded-lg bg-[var(--blue)] px-4 py-2 text-[12px] font-medium text-white transition-all hover:bg-[var(--blue)]/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Add Alert
            </button>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="panel p-0 overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <div className="text-[12px] font-semibold">🔔 Your Alerts ({alerts.length})</div>
        </div>

        {alerts.length === 0 ? (
          <div className="flex h-[150px] items-center justify-center text-[12px] text-[var(--text-muted)]">
            No alerts set. Create one above to get notified when APY crosses your target.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {alerts.map((alert) => {
              const pool = pools.find((p) => p.id === alert.poolId);
              const isTriggered = triggeredIds.has(alert.id);
              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between px-5 py-3 transition-colors ${
                    isTriggered ? 'bg-[var(--amber-dim)]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`text-[14px] ${alert.enabled ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}
                    >
                      {alert.enabled ? '🔔' : '🔕'}
                    </button>
                    <div className="h-2 w-2 rounded-full" style={{ background: CHAIN_COLORS[pool?.chain ?? 'ethereum'] }} />
                    <div>
                      <div className="flex items-center gap-2 text-[12px] font-medium">
                        {alert.poolSymbol}
                        {isTriggered && (
                          <span className="inline-flex items-center rounded-full bg-[var(--amber)] px-2 py-0.5 text-[9px] font-bold text-black">
                            TRIGGERED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {pool?.protocol ?? 'Unknown'} · {CHAIN_LABELS[pool?.chain ?? 'ethereum']}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-[12px] font-mono font-semibold ${
                        alert.direction === 'above' ? 'text-[var(--green)]' : 'text-[var(--red)]'
                      }`}>
                        {alert.direction === 'above' ? '↑' : '↓'} {formatPct(alert.threshold)}
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)]">
                        Current: {pool ? formatPct(pool.apy) : '—'}
                      </div>
                    </div>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="rounded-md px-2 py-1 text-[10px] text-[var(--red)] transition-all hover:bg-[var(--red)]/10"
                    >
                      ✕
                    </button>
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
