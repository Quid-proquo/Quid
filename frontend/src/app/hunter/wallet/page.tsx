"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { HORIZON_URL, useWallet } from "@/app/hooks/useWallet";
import { useWallet as useWalletContext } from "@/context/WalletProvider";
import { toast } from "@/context/ToastContext";
import { ApiSessionExpiredError, apiFetch } from "@/lib/api/client";
import { signFreighterTransaction } from "@/lib/freighter-wallet";
import { ComingSoonBadge } from "@/components/ui/coming-soon";
import {
  buildWalletOverview,
  formatUsd,
  normalizeClaimables,
  shortAddress,
  sortClaimablesByUsd,
  toHistoryItems,
  type Claimable,
} from "@/features/wallet/hunter-wallet";

const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ??
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

interface ClaimState {
  phase: "loading" | "ready" | "error";
  items: Claimable[];
  message?: string;
}

function formatAmount(value: string | null): string {
  if (!value) return "0";
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("en-US", { maximumFractionDigits: 7 })
    : value;
}

export default function HunterWalletPage() {
  const wallet = useWallet();
  const {
    expectedNetwork,
    isNetworkMismatch,
    authenticate,
    refreshBalances: refreshContextBalances,
  } = useWalletContext();
  const [claimState, setClaimState] = useState<ClaimState>({
    phase: "loading",
    items: [],
  });
  const [claiming, setClaiming] = useState<string | null>(null);
  const [trustlining, setTrustlining] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadClaimables = useCallback(async () => {
    const address = wallet.publicKey;
    if (!address) return;
    setClaimState((previous) => ({ ...previous, phase: "loading" }));
    const fetchClaimables = async (): Promise<Claimable[]> => {
      const response = await apiFetch("/hunter/claimables", { address });
      if (!response.ok) {
        throw new Error(`Unable to load claimables (${response.status})`);
      }
      return normalizeClaimables(await response.json());
    };

    try {
      setClaimState({ phase: "ready", items: await fetchClaimables() });
    } catch (error) {
      if (error instanceof ApiSessionExpiredError) {
        try {
          await authenticate();
          setClaimState({ phase: "ready", items: await fetchClaimables() });
          return;
        } catch (authError) {
          setClaimState({
            phase: "error",
            items: [],
            message:
              authError instanceof Error
                ? authError.message
                : "Sign in again to view claimables.",
          });
          return;
        }
      }
      setClaimState({
        phase: "error",
        items: [],
        message: error instanceof Error ? error.message : "Unable to load claimables",
      });
    }
  }, [wallet.publicKey, authenticate]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadClaimables(), 0);
    return () => window.clearTimeout(timer);
  }, [loadClaimables]);

  const sortedClaimables = useMemo(
    () => sortClaimablesByUsd(claimState.items),
    [claimState.items],
  );
  const history = useMemo(
    () => toHistoryItems(wallet.transactions),
    [wallet.transactions],
  );
  const overview = useMemo(
    () => buildWalletOverview(wallet.balances, sortedClaimables),
    [wallet.balances, sortedClaimables],
  );
  const networkReady =
    expectedNetwork === Networks.TESTNET && !isNetworkMismatch;
  const hasUsdc = wallet.balances.some(
    (balance) => balance.assetCode === "USDC",
  );

  const handleClaim = async (item: Claimable) => {
    if (!wallet.publicKey) return;
    setClaiming(item.submissionId);
    try {
      const response = await apiFetch(
        `/hunter/claimables/${encodeURIComponent(item.submissionId)}/claim`,
        { address: wallet.publicKey, init: { method: "POST" } },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? `Claim failed (${response.status})`);
      }
      toast.success("Claim recorded", {
        id: `claim-${item.submissionId}`,
        description: `${item.amount} ${item.asset} queued for payout.`,
      });
      wallet.refreshBalances();
      void refreshContextBalances();
      await loadClaimables();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to record claim",
      );
    } finally {
      setClaiming(null);
    }
  };

  const handleAddTrustline = async () => {
    if (!wallet.publicKey) return;
    setTrustlining(true);
    try {
      const server = new Horizon.Server(HORIZON_URL);
      const account = await server
        .accounts()
        .accountId(wallet.publicKey)
        .call();
      const transaction = new TransactionBuilder(
        new Account(wallet.publicKey, account.sequence),
        { fee: BASE_FEE, networkPassphrase: expectedNetwork },
      )
        .addOperation(
          Operation.changeTrust({ asset: new Asset("USDC", USDC_ISSUER) }),
        )
        .setTimeout(180)
        .build();
      const signed = await signFreighterTransaction(
        transaction.toXDR(),
        wallet.publicKey,
        Networks.TESTNET,
      );
      await server.submitTransaction(
        TransactionBuilder.fromXDR(signed, Networks.TESTNET),
      );
      toast.success("USDC trustline added");
      wallet.refreshBalances();
      void refreshContextBalances();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to add USDC trustline",
      );
    } finally {
      setTrustlining(false);
    }
  };

  const handleCopy = async () => {
    if (!wallet.publicKey) return;
    try {
      await navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy address");
    }
  };

  if (!wallet.isConnected || !wallet.publicKey) {
    return (
      <div className="min-h-screen bg-background brutal-grid-bg px-5 py-10 text-foreground sm:px-8">
        <p className="text-sm uppercase tracking-[0.24em] text-foreground">
          Hunter
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase">Wallet</h1>
        <div className="mt-8 max-w-md border border-foreground bg-card p-6 brutal-shadow">
          <Wallet className="size-10" />
          <h2 className="mt-4 text-lg font-black uppercase">
            Connect your wallet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect Freighter to view balances, claim rewards and review payout
            history.
          </p>
          <Link
            href="/connect-wallet"
            className="mt-6 inline-flex min-h-11 items-center brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase"
          >
            Connect wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background brutal-grid-bg px-5 py-10 text-foreground sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-foreground">
            Hunter
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
            Wallet
          </h1>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="mt-3 inline-flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-foreground"
          >
            {shortAddress(wallet.publicKey)}
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`border border-foreground px-3 py-2 text-xs font-bold uppercase ${networkReady ? "bg-brutal-lime" : "bg-brutal-pink"}`}
          >
            {networkReady ? "Testnet ready" : "Network mismatch"}
          </span>
          <button
            type="button"
            onClick={() => {
              wallet.refreshBalances();
              void refreshContextBalances();
              void loadClaimables();
            }}
            className="inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-card px-4 text-sm font-bold uppercase"
          >
            <RefreshCw
              className={`size-4 ${wallet.loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {!networkReady ? (
        <div className="mt-6 flex items-start gap-3 border border-foreground bg-brutal-pink/20 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-bold uppercase">
              Switch Freighter to testnet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Claim and trustline actions stay disabled until the wallet network
              matches Quid.
            </p>
          </div>
        </div>
      ) : null}

      {wallet.error ? (
        <div className="mt-6 flex items-start gap-3 border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p>{wallet.error}</p>
        </div>
      ) : null}

      {!wallet.funded && !wallet.loading ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-foreground bg-brutal-yellow/20 p-4">
          <div>
            <p className="text-sm font-bold uppercase">Account not funded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This testnet account does not exist on the ledger yet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void wallet.fundWithFriendbot()}
            disabled={wallet.funding || !networkReady}
            className="inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase disabled:opacity-50"
          >
            {wallet.funding ? <Loader2 className="size-4 animate-spin" /> : null}
            Fund with Friendbot
          </button>
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-foreground bg-card p-5 brutal-shadow">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Total value
          </p>
          <p className="mt-2 text-3xl font-black">{formatUsd(overview.totalUsd)}</p>
        </div>
        <div className="border border-foreground bg-card p-5 brutal-shadow">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            On-chain balance
          </p>
          <p className="mt-2 text-xl font-black">
            {formatAmount(overview.xlm)} XLM
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatAmount(overview.usdc)} USDC
          </p>
        </div>
        <div className="border border-foreground bg-brutal-lime/20 p-5 brutal-shadow">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Ready to claim
          </p>
          <p className="mt-2 text-3xl font-black">
            {formatUsd(overview.claimableUsd)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {sortedClaimables.length} approved reward
            {sortedClaimables.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black uppercase">Claimable rewards</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sorted by USD value, largest first.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadClaimables()}
            className="text-xs font-bold uppercase underline underline-offset-4"
          >
            Refresh rewards
          </button>
        </div>

        {claimState.phase === "loading" ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading rewards...
          </p>
        ) : claimState.phase === "error" ? (
          <div className="mt-5 border border-red-500/40 bg-red-500/10 p-4 text-sm">
            <p>{claimState.message}</p>
            <button
              type="button"
              onClick={() => void loadClaimables()}
              className="mt-3 text-xs font-bold uppercase underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : sortedClaimables.length === 0 ? (
          <p className="mt-5 border border-dashed border-foreground/40 p-6 text-sm text-muted-foreground">
            No approved rewards yet. Submit a mission report to get started.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {sortedClaimables.map((item) => (
              <li
                key={item.submissionId}
                className="flex flex-wrap items-center justify-between gap-4 border border-foreground bg-card p-4 brutal-shadow"
              >
                <div className="min-w-0">
                  <p className="truncate font-black uppercase">{item.missionTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.amount} {item.asset} · {formatUsd(item.usdValue)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleClaim(item)}
                  disabled={!networkReady || claiming !== null}
                  className="inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase disabled:opacity-50"
                >
                  {claiming === item.submissionId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Claim
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {networkReady && wallet.funded && !hasUsdc ? (
        <section className="mt-10 flex flex-wrap items-center justify-between gap-4 border border-foreground bg-card p-5 brutal-shadow">
          <div>
            <h2 className="text-lg font-black uppercase">Add USDC trustline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Required before official testnet USDC rewards can appear.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleAddTrustline()}
            disabled={trustlining}
            className="inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-brutal-pink px-4 text-sm font-bold uppercase disabled:opacity-50"
          >
            {trustlining ? <Loader2 className="size-4 animate-spin" /> : null}
            Add trustline
          </button>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl font-black uppercase">Transaction history</h2>
        {wallet.loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading history...
          </p>
        ) : history.length === 0 ? (
          <p className="mt-5 border border-dashed border-foreground/40 p-6 text-sm text-muted-foreground">
            No payments yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {history.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-foreground/60 bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center border border-foreground">
                    {item.direction === "in" ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.detail} · {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-black">
                    {formatAmount(item.amount)} {item.asset}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="View transaction on explorer"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 max-w-xl border border-foreground bg-card p-5 brutal-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide">
            Cash out to fiat
          </h2>
          <ComingSoonBadge feature="sep24-cashout" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Anchor payouts are not live yet. On-chain rewards remain in your
          wallet.
        </p>
      </section>
    </div>
  );
}
