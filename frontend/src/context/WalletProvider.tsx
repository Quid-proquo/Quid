'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Horizon, Networks } from '@stellar/stellar-sdk';
import { WatchWalletChanges } from '@stellar/freighter-api';
import {
  connectFreighter,
  FREIGHTER_WALLET,
  getExpectedNetwork,
  getFreighterAddressIfConnected,
  getFreighterNetwork,
} from '@/lib/freighter-wallet';
import {
  authenticate,
  clearStoredSession,
  getStoredSession,
  onSessionChanged,
} from '@/lib/api/client';
import { clearUserRole } from '@/lib/onboarding';

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

export interface WalletContextState {
  connected: boolean;
  publicKey?: string;
  walletName?: string;
  balances: Balance[];
  /** Passphrase the connected wallet is currently on, if it could be read. */
  network?: string;
  /** Passphrase Quid expects — from `NEXT_PUBLIC_STELLAR_NETWORK`, testnet by default. */
  expectedNetwork: string;
  /**
   * True when the wallet is connected to a known network that is not the one
   * Quid is deployed to. Write actions must stay disabled while this is true.
   */
  isNetworkMismatch: boolean;
  connect: () => Promise<string | undefined>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  getAvailableWallets: () => Promise<SupportedWallet[]>;
  /** Issue #324: SEP-10 session JWT for the connected wallet, if any. */
  token?: string;
  isAuthenticated: boolean;
  /** Issue #324: non-fatal authentication error (e.g. backend unreachable). */
  authError?: string;
  /** Issue #324: run challenge -> sign -> verify and store the JWT. */
  authenticate: () => Promise<string>;
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
  const [network, setNetwork] = useState<string>();
  const [token, setToken] = useState<string>();
  const [authError, setAuthError] = useState<string>();
  const [server] = useState(() => new Horizon.Server(horizonUrl));
  const [expectedNetwork] = useState<string>(() => getExpectedNetwork());
  const watcherRef = useRef<WatchWalletChanges | null>(null);

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

  const refreshNetwork = useCallback(async () => {
    setNetwork(await getFreighterNetwork());
  }, []);

  const connect = useCallback(async (): Promise<string | undefined> => {
    try {
      const address = await connectFreighter();

      setPublicKey(address);
      setWalletName(FREIGHTER_WALLET.name);
      setConnected(true);
      persistSession(address);
      await Promise.all([loadBalances(address), refreshNetwork()]);

      // Issue #324: wallet login unlocks the API. Best-effort SEP-10 sign-in:
      // a missing backend (frontend-only mode) or a declined signature must
      // not break wallet connection, so failures are surfaced via authError.
      try {
        const session = await authenticate(address);
        setToken(session.accessToken);
        setAuthError(undefined);
      } catch (authErr) {
        setAuthError(
          authErr instanceof Error
            ? authErr.message
            : 'Failed to authenticate with the API',
        );
      }

      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [loadBalances, persistSession, refreshNetwork]);

  const authenticateApi = useCallback(async (): Promise<string> => {
    if (!publicKey) {
      throw new Error('Connect a wallet before authenticating with the API');
    }

    const session = await authenticate(publicKey);
    setToken(session.accessToken);
    setAuthError(undefined);
    return session.accessToken;
  }, [publicKey]);

  const disconnect = useCallback(async () => {
    setConnected(false);
    setPublicKey(undefined);
    setWalletName(undefined);
    setBalances([]);
    setNetwork(undefined);
    setToken(undefined);
    setAuthError(undefined);
    clearSession();
    // Issue #324: a disconnect must drop the SEP-10 JWT and the cached role
    // so a reconnect starts from a clean slate.
    if (publicKey) clearStoredSession(publicKey);
    clearUserRole();
  }, [clearSession, publicKey]);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) return;
    await loadBalances(publicKey);
  }, [loadBalances, publicKey]);

  const getAvailableWallets = useCallback(async () => {
    return [FREIGHTER_WALLET];
  }, []);

  // Watch for the user switching networks (or accounts) inside the extension.
  // Without this the banner would only correct itself after a page reload.
  useEffect(() => {
    if (!connected) return;

    const watcher = new WatchWalletChanges();
    watcherRef.current = watcher;

    watcher.watch(({ network: nextNetwork }) => {
      if (nextNetwork) setNetwork(nextNetwork);
    });

    return () => {
      watcher.stop();
      watcherRef.current = null;
    };
  }, [connected]);

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
        await Promise.all([loadBalances(address), refreshNetwork()]);
      } catch {
        clearSession();
      }
    };

    void autoReconnect();
  }, [clearSession, loadBalances, refreshNetwork]);

  // Issue #324: keep the in-memory token in lock-step with the central session
  // store. Triggers on reconnect (token already present), on a lazy sign-in
  // elsewhere (e.g. onboarding), and on a 401 clearing the session.
  useEffect(() => {
    if (!publicKey) return;

    const timer = window.setTimeout(
      () => setToken(getStoredSession(publicKey)?.accessToken),
      0,
    );

    const unsubscribe = onSessionChanged((sessionAddress, session) => {
      if (sessionAddress === publicKey) {
        setToken(session?.accessToken);
      }
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [publicKey]);

  const value: WalletContextState = {
    connected,
    publicKey,
    walletName,
    balances,
    network,
    expectedNetwork,
    // An unreadable network is not a mismatch: stay permissive rather than
    // blocking users over a transient extension error.
    isNetworkMismatch: Boolean(network && network !== expectedNetwork),
    connect,
    disconnect,
    refreshBalances,
    getAvailableWallets,
    token,
    isAuthenticated: Boolean(token),
    authError,
    authenticate: authenticateApi,
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
