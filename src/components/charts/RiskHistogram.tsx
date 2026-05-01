// ============================================================
// Charts — Risk Distribution Histogram
// ============================================================

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { RiskAssessment } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { RISK_COLORS } from '@/utils';

interface RiskHistogramProps {
  risks: RiskAssessment[];
}

export function RiskHistogram({ risks }: RiskHistogramProps) {
  const data = useMemo(() => {
    const buckets = [
      { range: '0-10', min: 0, max: 10, count: 0, color: RISK_COLORS['Very Low'] },
      { range: '10-20', min: 10, max: 20, count: 0, color: RISK_COLORS['Very Low'] },
      { range: '20-30', min: 20, max: 30, count: 0, color: RISK_COLORS['Low'] },
      { range: '30-40', min: 30, max: 40, count: 0, color: RISK_COLORS['Low'] },
      { range: '40-50', min: 40, max: 50, count: 0, color: RISK_COLORS['Medium'] },
      { range: '50-60', min: 50, max: 60, count: 0, color: RISK_COLORS['Medium'] },
      { range: '60-70', min: 60, max: 70, count: 0, color: RISK_COLORS['High'] },
      { range: '70-80', min: 70, max: 80, count: 0, color: RISK_COLORS['High'] },
      { range: '80-90', min: 80, max: 90, count: 0, color: RISK_COLORS['Very High'] },
      { range: '90-100', min: 90, max: 100, count: 0, color: RISK_COLORS['Very High'] },
    ];

    risks.forEach((r) => {
      const bucket = buckets.find((b) => r.score >= b.min && r.score < b.max);
      if (bucket) bucket.count++;
      else if (r.score === 100) buckets[9].count++;
    });

    return buckets;
  }, [risks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
      </CardHeader>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11 }}
              label={{
                value: 'Risk Score Range',
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: 12 },
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: 'Pool Count',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                    <div className="text-sm font-medium">Risk: {d.range}</div>
                    <div className="text-sm text-muted-foreground">
                      {d.count} pools
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
