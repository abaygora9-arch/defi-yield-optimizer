// ============================================================
// Header Bar — Clean minimal
// ============================================================

'use client';

import type { StrategyMode } from '@/types';
import { cn } from '@/utils';

const MODES: { value: StrategyMode; label: string }[] = [
  { value: 'conservative', label: '🛡 Conservative' },
  { value: 'balanced', label: '⚖ Balanced' },
  { value: 'aggressive', label: '⚡ Aggressive' },
];

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  mode: StrategyMode;
  onModeChange: (m: StrategyMode) => void;
  timestamp?: string;
}

export function HeaderBar({ title, subtitle, mode, onModeChange, timestamp }: HeaderBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-6 py-3">
      <div>
        <h1 className="text-[15px] font-semibold">{title}</h1>
        {subtitle && <p className="text-[11px] text-[var(--text-muted)]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
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
