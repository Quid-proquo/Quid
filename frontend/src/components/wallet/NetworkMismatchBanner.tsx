'use client';

import { AlertTriangle } from 'lucide-react';
import { useWallet } from '@/context/WalletProvider';
import { describeNetwork } from '@/lib/freighter-wallet';

/**
 * Issue #323 — blocks signing on the wrong chain.
 *
 * Renders nothing unless the connected wallet reports a network that is not
 * the one Quid is deployed to. Pair it with `isNetworkMismatch` to disable
 * write CTAs while this is visible.
 */
export default function NetworkMismatchBanner() {
  const { isNetworkMismatch, network, expectedNetwork, connected } = useWallet();

  if (!connected || !isNetworkMismatch || !network) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      <div>
        <p className="font-bold">
          Wallet is on {describeNetwork(network)} — Quid is deployed on{' '}
          {describeNetwork(expectedNetwork)}
        </p>
        <p className="mt-1 text-red-200/80">
          Switch {`Freighter`} to {describeNetwork(expectedNetwork)} before
          submitting or approving anything. Transactions signed on the wrong
          network cannot be recovered.
        </p>
      </div>
    </div>
  );
}
