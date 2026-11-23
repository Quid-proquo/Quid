import type {
  WalletBalance,
  WalletTransaction,
} from "@/app/hooks/useWallet";

export interface Claimable {
  submissionId: string;
  missionTitle: string;
  amount: string;
  asset: string;
  approvedAt: string;
  usdValue: number;
}

export interface WalletOverview {
  totalUsd: number;
  walletUsd: number;
  claimableUsd: number;
  xlm: string | null;
  usdc: string | null;
}

export interface WalletHistoryItem {
  id: string;
  title: string;
  detail: string;
  amount: string;
  asset: string;
  direction: "in" | "out";
  date: string;
  href: string | null;
}

export const DEFAULT_TOKEN_USD_PRICES: Record<string, number> = {
  XLM: 0.1,
  USDC: 1,
  "USD Coin": 1,
};

export function getTokenUsdPrice(
  asset: string,
  prices: Record<string, number> = DEFAULT_TOKEN_USD_PRICES,
): number {
  return prices[asset] ?? prices[asset.toUpperCase()] ?? 0;
}

export function getUsdValue(
  amount: string,
  asset: string,
  prices: Record<string, number> = DEFAULT_TOKEN_USD_PRICES,
): number {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return 0;
  return parsed * getTokenUsdPrice(asset, prices);
}

export function normalizeClaimables(
  raw: unknown,
  prices: Record<string, number> = DEFAULT_TOKEN_USD_PRICES,
): Claimable[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    if (
      typeof item.submissionId !== "string" ||
      typeof item.amount !== "string" ||
      typeof item.asset !== "string"
    ) {
      return [];
    }
    return [
      {
        submissionId: item.submissionId,
        missionTitle:
          typeof item.missionTitle === "string"
            ? item.missionTitle
            : "Approved mission",
        amount: item.amount,
        asset: item.asset,
        approvedAt:
          typeof item.approvedAt === "string"
            ? item.approvedAt
            : new Date(0).toISOString(),
        usdValue: getUsdValue(item.amount, item.asset, prices),
      },
    ];
  });
}

export function sortClaimablesByUsd(claimables: Claimable[]): Claimable[] {
  return [...claimables].sort((a, b) => b.usdValue - a.usdValue);
}

export function buildWalletOverview(
  balances: WalletBalance[],
  claimables: Claimable[],
  prices: Record<string, number> = DEFAULT_TOKEN_USD_PRICES,
): WalletOverview {
  const walletUsd = balances.reduce(
    (sum, balance) => sum + getUsdValue(balance.balance, balance.assetCode, prices),
    0,
  );
  const claimableUsd = claimables.reduce((sum, item) => sum + item.usdValue, 0);
  const xlm = balances.find((balance) => balance.assetType === "native")?.balance ?? null;
  const usdc = balances.find((balance) => balance.assetCode === "USDC")?.balance ?? null;

  return {
    totalUsd: walletUsd + claimableUsd,
    walletUsd,
    claimableUsd,
    xlm,
    usdc,
  };
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function explorerTxUrl(hash: string): string | null {
  if (!hash) return null;
  const base =
    process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL ??
    "https://stellar.expert/explorer/testnet";
  return `${base.replace(/\/$/, "")}/tx/${hash}`;
}

export function toHistoryItems(
  transactions: WalletTransaction[],
): WalletHistoryItem[] {
  return transactions.map((transaction) => ({
    id: transaction.id,
    title:
      transaction.type === "create_account"
        ? "Account created"
        : transaction.direction === "in"
          ? "Payment received"
          : "Payment sent",
    detail: shortAddress(transaction.counterparty),
    amount: transaction.amount,
    asset: transaction.assetCode,
    direction: transaction.direction,
    date: transaction.date,
    href: explorerTxUrl(transaction.hash),
  }));
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
