// ============================================================
// Custom Hooks — Data Fetching + State Management
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DeFiPool, RiskAssessment, StrategyRanking, StrategyMode, Chain, SimulationResult, PoolExplanation } from '@/types';

// --- Types ---
export interface DashboardData {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  rankings: StrategyRanking[];
  stats: {
    totalPools: number;
    avgApy: number;
    avgRisk: number;
    trapPools: number;
    chains: string[];
  };
  timestamp: string;
}

export interface Filters {
  chains: Chain[];
  minTvl: number;
  stablecoinOnly: boolean;
  mode: StrategyMode;
  limit: number;
}

const DEFAULT_FILTERS: Filters = {
  chains: [],
  minTvl: 0,
  stablecoinOnly: false,
  mode: 'balanced',
  limit: 50,
};

// --- usePools Hook ---
export function usePools(initialFilters?: Partial<Filters>) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (f: Filters) => {
    // Abort previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (f.chains.length > 0) params.set('chains', f.chains.join(','));
      if (f.minTvl > 0) params.set('minTvl', String(f.minTvl));
      if (f.stablecoinOnly) params.set('stablecoin', 'true');
      params.set('mode', f.mode);
      params.set('limit', String(f.limit));

      const res = await fetch(`/api/pools?${params.toString()}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setData(json);
      setLastRefreshTime(new Date().toISOString());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const refresh = useCallback(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  return { data, loading, error, filters, updateFilters, refresh, lastRefreshTime };
}

// --- useAutoRefresh Hook ---
export function useAutoRefresh(refresh: () => void, intervalSeconds: number) {
  const [enabled, setEnabled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('defi-auto-refresh');
    if (stored) {
      const seconds = parseInt(stored, 10);
      if (!isNaN(seconds) && seconds > 0) {
        setEnabled(true);
      }
    }
  }, []);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (enabled && intervalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        refresh();
      }, intervalSeconds * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalSeconds, refresh]);

  const toggle = useCallback((seconds: number) => {
    if (seconds > 0) {
      setEnabled(true);
      localStorage.setItem('defi-auto-refresh', String(seconds));
    } else {
      setEnabled(false);
      localStorage.removeItem('defi-auto-refresh');
    }
  }, []);

  return { enabled, interval: enabled ? intervalSeconds : 0, toggle };
}

// --- useSimulation Hook ---
export function useSimulation() {
  const [result, setResult] = useState<{
    simulation: SimulationResult;
    risk: RiskAssessment;
    explanation: PoolExplanation;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = useCallback(
    async (pool: DeFiPool, capital: number, days: number, mode: StrategyMode) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capital, timeHorizonDays: days, pool, mode }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        setResult(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Simulation failed');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, simulate };
}
