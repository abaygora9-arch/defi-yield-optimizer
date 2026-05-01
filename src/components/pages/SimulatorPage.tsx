// ============================================================
// Simulator Page — Monte Carlo Engine
// ============================================================

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DeFiPool, RiskAssessment, StrategyMode, SavedSimulation } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import { formatUsd, formatPct, CHAIN_LABELS } from '@/utils';
import { useSimulation } from '@/hooks/useData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';

const SAVED_SIMS_KEY = 'defi_saved_sims';
const MAX_SAVED_SIMS = 20;

function loadSavedSims(): SavedSimulation[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_SIMS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSimsToStorage(sims: SavedSimulation[]) {
  localStorage.setItem(SAVED_SIMS_KEY, JSON.stringify(sims));
}

function generateId(): string {
  return `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface SimulatorPageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  mode: StrategyMode;
}

export function SimulatorPage({ pools, risks, mode }: SimulatorPageProps) {
  const { result, loading, error, simulate } = useSimulation();
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [capital, setCapital] = useState(10000);
  const [days, setDays] = useState(365);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load saved sims on mount
  useEffect(() => {
    setSavedSims(loadSavedSims());
  }, []);

  const selectedPool = pools.find((p) => p.id === selectedPoolId);

  // Save current simulation
  const handleSave = useCallback(() => {
    if (!result || !selectedPool) return;
    const sim: SavedSimulation = {
      id: generateId(),
      poolSymbol: selectedPool.symbol,
      poolId: selectedPool.id,
      capital,
      days,
      riskMode: mode,
      results: {
        expectedReturn: result.simulation.expectedReturn,
        worstCase: result.simulation.worstCase,
        bestCase: result.simulation.bestCase,
        sharpeRatio: result.simulation.sharpeLikeRatio,
        netReturn: result.simulation.netReturn,
      },
      timestamp: new Date().toISOString(),
    };
    setSavedSims((prev) => {
      const next = [sim, ...prev].slice(0, MAX_SAVED_SIMS);
      saveSimsToStorage(next);
      return next;
    });
    setSaveMessage('Simulation saved!');
    setTimeout(() => setSaveMessage(null), 2000);
  }, [result, selectedPool, capital, days, mode]);

  // Load a saved simulation
  const handleLoad = useCallback((sim: SavedSimulation) => {
    setCapital(sim.capital);
    setDays(sim.days);
    setSelectedPoolId(sim.poolId);
    setShowSaved(false);
  }, []);

  // Delete a saved simulation
  const handleDeleteSaved = useCallback((id: string) => {
    setSavedSims((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSimsToStorage(next);
      return next;
    });
  }, []);

  const riskMap = useMemo(() => new Map(risks.map((r) => [r.poolId, r])), [risks]);

  // Filter pools for search
  const searchResults = useMemo(() => {
    if (!searchQuery) return pools.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return pools
      .filter((p) => p.symbol.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q))
      .slice(0, 20);
  }, [pools, searchQuery]);

  const handleSimulate = () => {
    if (!selectedPool) return;
    simulate(selectedPool, capital, days, mode);
  };

  // Preset capital buttons
  const presets = [1000, 5000, 10000, 50000, 100000];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Config Panel */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pool Selector */}
        <Card className="glass glow-blue">
          <div className="mb-3 text-sm font-semibold">Select Pool</div>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">⌕</span>
            <input
              type="text"
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-black/30 py-2 pl-9 pr-4 text-sm text-white placeholder-[var(--muted-foreground)] outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="max-h-[240px] space-y-1 overflow-y-auto">
            {searchResults.map((pool) => {
              const risk = riskMap.get(pool.id);
              const isSelected = pool.id === selectedPoolId;
              return (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPoolId(pool.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                    isSelected
                      ? 'bg-blue-500/20 ring-1 ring-blue-500/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div>
                    <span className="font-medium">{pool.symbol}</span>
                    <span className="ml-2 text-[var(--muted-foreground)]">{pool.protocol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--success)]">{formatPct(pool.apy)}</span>
                    {risk && (
                      <span className="text-[var(--muted-foreground)]">R:{risk.score}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedPool && (
            <div className="mt-3 rounded-lg bg-blue-500/10 p-3 text-xs">
              <div className="font-semibold text-blue-400">{selectedPool.symbol}</div>
              <div className="text-[var(--muted-foreground)]">
                {selectedPool.protocol} · {CHAIN_LABELS[selectedPool.chain]} · TVL {formatUsd(selectedPool.tvlUsd)}
              </div>
            </div>
          )}
        </Card>

        {/* Parameters */}
        <Card className="glass glow-purple">
          <div className="mb-3 text-sm font-semibold">Simulation Parameters</div>
          <div className="space-y-4">
            {/* Capital */}
            <div>
              <label className="mb-1.5 block text-xs text-[var(--muted-foreground)]">Capital (USD)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
              />
              <div className="mt-2 flex gap-2">
                {presets.map((v) => (
                  <button
                    key={v}
                    onClick={() => setCapital(v)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-all ${
                      capital === v
                        ? 'bg-blue-500/30 text-blue-400'
                        : 'bg-white/5 text-[var(--muted-foreground)] hover:bg-white/10'
                    }`}
                  >
                    ${v >= 1000 ? `${v / 1000}K` : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div>
              <label className="mb-1.5 block text-xs text-[var(--muted-foreground)]">Time Horizon (Days)</label>
              <input
                type="range"
                min={7}
                max={730}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
                <span>7d</span>
                <span className="font-medium text-white">{days} days ({(days / 30).toFixed(1)} months)</span>
                <span>2yr</span>
              </div>
            </div>

            {/* Run button */}
            <Button
              onClick={handleSimulate}
              disabled={!selectedPool || loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              {loading ? '⏳ Running Monte Carlo...' : '▶ Run Simulation'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Results */}
      {error && (
        <div className="glass border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          ⚠ {error}
        </div>
      )}

      {result && selectedPool && (
        <div className="space-y-4 animate-fade-in">
          {/* Save / Saved toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="rounded-lg bg-[var(--success)]/20 px-4 py-2 text-[12px] font-medium text-[var(--success)] transition-all hover:bg-[var(--success)]/30"
            >
              💾 Save Simulation
            </button>
            {saveMessage && (
              <span className="text-[11px] text-[var(--success)] animate-fade-in">{saveMessage}</span>
            )}
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="rounded-lg bg-white/[0.05] px-4 py-2 text-[12px] font-medium text-[var(--muted-foreground)] transition-all hover:bg-white/[0.10]"
            >
              📂 Saved ({savedSims.length})
            </button>
          </div>

          {/* Result Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ResultStat label="Expected Return" value={formatUsd(result.simulation.expectedReturn)} color="text-blue-400" />
            <ResultStat label="Best Case (95th)" value={formatUsd(result.simulation.bestCase)} color="text-[var(--success)]" />
            <ResultStat label="Worst Case (5th)" value={formatUsd(result.simulation.worstCase)} color="text-[var(--danger)]" />
            <ResultStat label="Sharpe-like Ratio" value={result.simulation.sharpeLikeRatio.toFixed(3)} color="text-purple-400" />
          </div>

          {/* Extra stats */}
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-3">
            <ResultStat label="Net Return" value={formatUsd(result.simulation.netReturn)} color="text-[var(--success)]" />
            <ResultStat label="IL Estimate" value={`${result.simulation.impermanentLossEstimate.toFixed(2)}%`} color="text-orange-400" />
            <ResultStat label="Gas Impact" value={`${result.simulation.gasImpact.toFixed(2)}%`} color="text-[var(--muted-foreground)]" />
          </div>

          {/* Growth Chart */}
          <Card className="glass glow-green p-0 overflow-hidden">
            <div className="border-b border-[var(--glass-border)] px-5 py-3">
              <div className="text-sm font-semibold">Portfolio Growth Projection</div>
              <div className="text-[10px] text-[var(--muted-foreground)]">
                {formatUsd(capital)} → {formatUsd(result.simulation.expectedReturn)} in {days} days
              </div>
            </div>
            <div className="h-[300px] px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.simulation.growthCurve}>
                  <defs>
                    <linearGradient id="gradExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="glass rounded-lg px-3 py-2 text-xs">
                          <div>Day {d.day}</div>
                          <div className="font-mono text-blue-400">{formatUsd(d.value)}</div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={capital} stroke="#64748b" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#gradExpected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Explanation */}
          <Card className="glass glow-purple">
            <div className="mb-2 text-sm font-semibold">{result.explanation.headline}</div>
            <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
              {result.explanation.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-400">▸</span>
                  {insight}
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-lg bg-blue-500/10 p-3 text-xs">
              <div className="font-semibold text-blue-400">Recommendation</div>
              <div className="mt-1 text-[var(--muted-foreground)]">{result.explanation.recommendation}</div>
            </div>
            <div className="mt-2 text-[10px] text-[var(--muted-foreground)]">{result.explanation.riskNote}</div>
          </Card>
        </div>
      )}

      {/* Saved Simulations Panel */}
      {showSaved && (
        <Card className="glass glow-purple p-0 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
            <div className="text-sm font-semibold">📂 Saved Simulations ({savedSims.length}/{MAX_SAVED_SIMS})</div>
            <button
              onClick={() => setShowSaved(false)}
              className="text-[var(--muted-foreground)] hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {savedSims.length === 0 ? (
            <div className="flex h-[120px] items-center justify-center text-xs text-[var(--muted-foreground)]">
              No saved simulations yet. Run a simulation and click Save.
            </div>
          ) : (
            <div className="divide-y divide-[var(--glass-border)] max-h-[400px] overflow-y-auto">
              {savedSims.map((sim) => (
                <div key={sim.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-xs font-medium">{sim.poolSymbol}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        ${sim.capital.toLocaleString()} · {sim.days}d · {sim.riskMode}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-mono text-[var(--success)]">
                        {formatUsd(sim.results.expectedReturn)}
                      </div>
                      <div className="text-[9px] text-[var(--muted-foreground)]">
                        Sharpe: {sim.results.sharpeRatio.toFixed(3)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        {new Date(sim.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleLoad(sim)}
                        className="rounded-md bg-[var(--blue)]/20 px-2 py-1 text-[10px] text-[var(--blue)] hover:bg-[var(--blue)]/30"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(sim.id)}
                        className="rounded-md bg-[var(--danger)]/20 px-2 py-1 text-[10px] text-[var(--danger)] hover:bg-[var(--danger)]/30"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="glass flex h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="text-4xl opacity-30">▷</div>
            <div className="mt-2 text-sm text-[var(--muted-foreground)]">
              Select a pool and run simulation to see results
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass p-4">
      <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
