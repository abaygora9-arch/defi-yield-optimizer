// ============================================================
// Wallet Context — MetaMask / WalletConnect via window.ethereum
// ============================================================

'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  isConnected: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts && accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
          setState({
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            isConnecting: false,
            error: null,
          });
        }
      } catch {
        // Silent fail
      }
    };
    checkConnection();
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => { const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setState({ address: null, chainId: null, isConnecting: false, error: null });
      } else {
        setState((prev) => ({ ...prev, address: accounts[0], error: null }));
      }
    };

    const handleChainChanged = (...args: unknown[]) => { const chainId = args[0] as string;
      setState((prev) => ({ ...prev, chainId: parseInt(chainId, 16) }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setState((prev) => ({ ...prev, error: 'No wallet detected. Install MetaMask or another Web3 wallet.' }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;

      if (accounts && accounts.length > 0) {
        setState({
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          isConnecting: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setState((prev) => ({ ...prev, isConnecting: false, error: message }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, isConnecting: false, error: null });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        isConnected: !!state.address,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

// Utility: truncate address
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Chain name mapping
export function getChainName(chainId: number | null): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    56: 'BNB Chain',
    42161: 'Arbitrum',
    137: 'Polygon',
    10: 'Optimism',
    8453: 'Base',
  };
  return chains[chainId ?? 0] ?? `Chain ${chainId}`;
}

// Extend Window for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
