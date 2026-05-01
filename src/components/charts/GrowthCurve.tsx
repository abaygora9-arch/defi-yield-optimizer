// ============================================================
// Charts — Portfolio Growth Simulation Curve
// ============================================================

'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SimulationResult } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { formatUsd } from '@/utils';

interface GrowthCurveProps {
  simulation: SimulationResult;
  capital: number;
}

export function GrowthCurve({ simulation, capital }: GrowthCurveProps) {
  const data = simulation.growthCurve.map((p) => ({
    day: p.day,
    value: p.value,
    // Generate worst/best case curves (simplified)
    worst: capital + (p.value - capital) * 0.3,
    best: capital + (p.value - capital) * 1.7,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Growth Simulation</CardTitle>
      </CardHeader>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="worstGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              label={{
                value: 'Days',
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: 12 },
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                    <div className="text-sm font-medium">Day {d.day}</div>
                    <div className="text-sm text-green-500">
                      Best: {formatUsd(d.best)}
                    </div>
                    <div className="text-sm text-blue-500">
                      Expected: {formatUsd(d.value)}
                    </div>
                    <div className="text-sm text-red-500">
                      Worst: {formatUsd(d.worst)}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={capital}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              label={{
                value: 'Initial Capital',
                position: 'right',
                style: { fontSize: 11, fill: '#94a3b8' },
              }}
            />
            <Area
              type="monotone"
              dataKey="best"
              stroke="#22c55e"
              strokeWidth={1}
              fill="url(#bestGrad)"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#growthGrad)"
            />
            <Area
              type="monotone"
              dataKey="worst"
              stroke="#ef4444"
              strokeWidth={1}
              fill="url(#worstGrad)"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Best case
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Expected
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Worst case
        </span>
      </div>
    </Card>
  );
}
