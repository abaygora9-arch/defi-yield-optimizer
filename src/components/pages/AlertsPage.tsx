// ============================================================
// Alerts Page — Yield APY Threshold Alerts
// ============================================================

'use client';

import type { DeFiPool, RiskAssessment } from '@/types';
import { AlertManager } from '@/components/alerts/AlertManager';

interface AlertsPageProps {
  pools: DeFiPool[];
  risks: RiskAssessment[];
  onAlertCountChange?: (count: number) => void;
}

export function AlertsPage({ pools, risks, onAlertCountChange }: AlertsPageProps) {
  return <AlertManager pools={pools} risks={risks} onAlertCountChange={onAlertCountChange} />;
}
