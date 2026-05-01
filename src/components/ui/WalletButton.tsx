// ============================================================
// Wallet Connect Button Component
// ============================================================

'use client';

import { useWallet, truncateAddress, getChainName } from '@/services/wallet';

export function WalletButton() {
  const { address, chainId, isConnecting, error, connect, disconnect, isConnected } = useWallet();

  if (isConnected && address) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--green-dim)] px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-[var(--green)]" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono font-medium text-[var(--green)]">
              {truncateAddress(address)}
            </div>
            <div className="text-[9px] text-[var(--text-muted)]">
              {getChainName(chainId)}
            </div>
          </div>
          <button
            onClick={disconnect}
            className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--blue)] to-[var(--purple)] px-3 py-2 text-[11px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
      >
        {isConnecting ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Connecting...
          </>
        ) : (
          <>
            ◆ Connect Wallet
          </>
        )}
      </button>
      {error && (
        <div className="text-[9px] text-[var(--red)] px-1">{error}</div>
      )}
    </div>
  );
}
