"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet as useWalletContext } from "@/context/WalletProvider";

/**
 * Horizon endpoint. Defaults to the public testnet so unfunded accounts can be
 * funded via Friendbot. Override with NEXT_PUBLIC_HORIZON_URL for other networks.
 */
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

export const FRIENDBOT_URL =
  process.env.NEXT_PUBLIC_FRIENDBOT_URL ?? "https://friendbot.stellar.org";

/** A single balance line item as returned by Horizon's `/accounts` endpoint. */
export interface WalletBalance {
  assetType: string;
  assetCode: string;
  assetIssuer?: string;
  balance: string;
}

/** A normalized payment, derived from Horizon's `/accounts/{id}/payments`. */
export interface WalletTransaction {
  id: string;
  hash: string;
  type: string;
  direction: "in" | "out";
  counterparty: string;
  amount: string;
  assetCode: string;
  date: string;
  successful: boolean;
}

interface HorizonBalance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

interface HorizonPayment {
  id: string;
  type: string;
  transaction_hash: string;
  transaction_successful?: boolean;
  created_at: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  from?: string;
  to?: string;
  funder?: string;
  account?: string;
  starting_balance?: string;
}

export interface UseWalletResult {
  /** Connected account public key (empty string when not connected). */
  publicKey: string;
  isConnected: boolean;
  /** All balances on the account, native first. */
  balances: WalletBalance[];
  /** Native XLM balance, or null when the account is unfunded. */
  xlm: string | null;
  /** USDC balance, or null when the account holds no USDC trustline. */
  usdc: string | null;
  /** Recent payments to/from the account, newest first. */
  transactions: WalletTransaction[];
  /** False when Horizon has no record of the account yet (needs funding). */
  funded: boolean;
  loading: boolean;
  error: string | null;
  /** Re-fetch balances + transactions from Horizon without a page reload. */
  refreshBalances: () => void;
  /** Fund the account on testnet via Friendbot, then refresh. */
  fundWithFriendbot: () => Promise<void>;
  funding: boolean;
}

function parseBalances(raw: HorizonBalance[]): WalletBalance[] {
  return raw
    .map((b) => ({
      assetType: b.asset_type,
      assetCode: b.asset_type === "native" ? "XLM" : b.asset_code ?? "",
      assetIssuer: b.asset_issuer,
      balance: b.balance,
    }))
    // Native asset first, then the rest in Horizon's order.
    .sort((a, b) =>
      a.assetType === "native" ? -1 : b.assetType === "native" ? 1 : 0,
    );
}

function parsePayments(
  records: HorizonPayment[],
  pk: string,
): WalletTransaction[] {
  const out: WalletTransaction[] = [];

  for (const r of records) {
    let amount: string | undefined;
    let assetCode = "XLM";
    let direction: "in" | "out";
    let counterparty: string | undefined;

    if (r.type === "create_account") {
      amount = r.starting_balance;
      direction = r.account === pk ? "in" : "out";
      counterparty = direction === "in" ? r.funder : r.account;
    } else if (
      r.type === "payment" ||
      r.type === "path_payment_strict_send" ||
      r.type === "path_payment_strict_receive"
    ) {
      amount = r.amount;
      assetCode = r.asset_type === "native" ? "XLM" : r.asset_code ?? "";
      direction = r.to === pk ? "in" : "out";
      counterparty = direction === "in" ? r.from : r.to;
    } else {
      // Skip operation types we can't represent as a simple debit/credit.
      continue;
    }

    out.push({
      id: r.id,
      hash: r.transaction_hash,
      type: r.type,
      direction,
      counterparty: counterparty ?? "",
      amount: amount ?? "0",
      assetCode,
      date: r.created_at,
      successful: r.transaction_successful !== false,
    });
  }

  return out;
}

/**
 * Reads the connected wallet's public key from the wallet provider and fetches
 * its balances and recent payments from Horizon. Exposes XLM/USDC balances, a
 * funded flag for unfunded testnet accounts, real transaction history, and a
 * manual refresh.
 */
export function useWallet(): UseWalletResult {
  const { publicKey: contextPublicKey, connected } = useWalletContext();
  const publicKey = contextPublicKey ?? "";
  const isConnected = connected;

  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [funded, setFunded] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [funding, setFunding] = useState<boolean>(false);

  const refreshBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances([]);
      setTransactions([]);
      setFunded(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accRes = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);

      // Horizon returns 404 for accounts that exist as a keypair but have not
      // been funded/created on the ledger yet.
      if (accRes.status === 404) {
        setBalances([]);
        setTransactions([]);
        setFunded(false);
        return;
      }

      if (!accRes.ok) {
        throw new Error(`Horizon responded with ${accRes.status}`);
      }

      const accData = await accRes.json();
      setBalances(parseBalances(accData.balances ?? []));
      setFunded(true);

      // Real transaction history via the account's payments endpoint
      // (the `_links.payments` href on the account response).
      const payRes = await fetch(
        `${HORIZON_URL}/accounts/${publicKey}/payments?order=desc&limit=15`,
      );
      if (payRes.ok) {
        const payData = await payRes.json();
        const records: HorizonPayment[] = payData?._embedded?.records ?? [];
        setTransactions(parsePayments(records, publicKey));
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to load wallet data:", err);
      setError("Unable to load wallet data. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  const fundWithFriendbot = useCallback(async () => {
    if (!publicKey) return;
    setFunding(true);
    setError(null);
    try {
      const res = await fetch(`${FRIENDBOT_URL}/?addr=${publicKey}`);
      if (!res.ok) {
        // Friendbot replies 400 "account already funded to starting balance"
        // for accounts that already exist — surface that clearly.
        let detail = `Friendbot responded with ${res.status}`;
        try {
          const body = await res.json();
          if (typeof body?.detail === "string") detail = body.detail;
        } catch {
          // non-JSON body; keep the status-based message
        }
        if (detail.toLowerCase().includes("already funded")) {
          throw new Error(
            "This account is already funded. Friendbot only funds new testnet accounts.",
          );
        }
        throw new Error(detail);
      }
      await refreshBalances();
    } catch (err) {
      console.error("Friendbot funding failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Friendbot funding failed. Try again in a moment.",
      );
    } finally {
      setFunding(false);
    }
  }, [publicKey, refreshBalances]);

  const find = (code: string) =>
    balances.find((b) => b.assetCode === code)?.balance ?? null;

  return {
    publicKey,
    isConnected,
    balances,
    xlm: find("XLM"),
    usdc: find("USDC"),
    transactions,
    funded,
    loading,
    error,
    refreshBalances,
    fundWithFriendbot,
    funding,
  };
}
