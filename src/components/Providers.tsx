// ============================================================
// Providers — Client-side providers wrapper
// ============================================================

'use client';

import { type ReactNode } from 'react';
import { WalletProvider } from '@/services/wallet';

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
