'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Horizon, Networks } from '@stellar/stellar-sdk';
import {
  connectFreighter,
  FREIGHTER_WALLET,
  getFreighterAddressIfConnected,
} from '@/lib/freighter-wallet';

export interface Balance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

export interface SupportedWallet {
  id: string;
  name: string;
  icon: string;
}

interface WalletContextState {
  connected: boolean;
  publicKey?: string;
  walletName?: string;
  balances: Balance[];
  connect: () => Promise<string | undefined>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  getAvailableWallets: () => Promise<SupportedWallet[]>;
}

interface WalletProviderProps {
  children: ReactNode;
  horizonUrl?: string;
}

const STORAGE_KEYS = {
  connected: 'quid_wallet_connected',
  address: 'quid_wallet_address',
} as const;

const WalletContext = createContext<WalletContextState | undefined>(undefined);

export function WalletProvider({
  children,
  horizonUrl = 'https://horizon-testnet.stellar.org',
}: WalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string>();
  const [walletName, setWalletName] = useState<string>();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [server] = useState(() => new Horizon.Server(horizonUrl));

  const loadBalances = useCallback(
    async (address: string) => {
      try {
        const account = await server.accounts().accountId(address).call();
        setBalances(account.balances as Balance[]);
      } catch (error: unknown) {
        const status =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status;

        if (status === 404) {
          setBalances([]);
          return;
        }

        console.error('Failed to load balances:', error);
        setBalances([]);
      }
    },
    [server],
  );

  const persistSession = useCallback((address: string) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.connected, 'true');
    localStorage.setItem(STORAGE_KEYS.address, address);
  }, []);

  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEYS.connected);
    localStorage.removeItem(STORAGE_KEYS.address);
  }, []);

  const connect = useCallback(async (): Promise<string | undefined> => {
    try {
      const address = await connectFreighter();

      setPublicKey(address);
      setWalletName(FREIGHTER_WALLET.name);
      setConnected(true);
      persistSession(address);
      await loadBalances(address);

      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [loadBalances, persistSession]);

  const disconnect = useCallback(async () => {
    setConnected(false);
    setPublicKey(undefined);
    setWalletName(undefined);
    setBalances([]);
    clearSession();
  }, [clearSession]);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) return;
    await loadBalances(publicKey);
  }, [loadBalances, publicKey]);

  const getAvailableWallets = useCallback(async () => {
    return [FREIGHTER_WALLET];
  }, []);

  useEffect(() => {
    const autoReconnect = async () => {
      if (typeof window === 'undefined') return;

      const wasConnected = localStorage.getItem(STORAGE_KEYS.connected);
      const savedAddress = localStorage.getItem(STORAGE_KEYS.address);

      if (wasConnected !== 'true' || !savedAddress) {
        return;
      }

      try {
        const address = await getFreighterAddressIfConnected();

        if (!address || address !== savedAddress) {
          clearSession();
          return;
        }

        setPublicKey(address);
        setWalletName(FREIGHTER_WALLET.name);
        setConnected(true);
        await loadBalances(address);
      } catch {
        clearSession();
      }
    };

    void autoReconnect();
  }, [clearSession, loadBalances]);

  const value: WalletContextState = {
    connected,
    publicKey,
    walletName,
    balances,
    connect,
    disconnect,
    refreshBalances,
    getAvailableWallets,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

/** @deprecated Use useWallet instead */
export const useWalletProvider = useWallet;

export const WALLET_NETWORK = Networks.TESTNET;
