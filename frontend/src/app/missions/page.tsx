'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletProvider';
import WalletConnectButton from '@/components/wallet/WalletConnectButton';
import { ONBOARDING_ROUTES } from '@/lib/onboarding';

export default function MissionsPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.replace(ONBOARDING_ROUTES.signUp);
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b0a11] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mission Board</h1>
        <WalletConnectButton variant="primary" />
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-white/70 mb-2">Welcome, hunter</p>
        <p className="text-sm text-white/40 mb-8 font-mono">{publicKey}</p>
        <h2 className="text-3xl font-bold mb-4">Available missions coming soon</h2>
        <p className="text-white/60 mb-8 max-w-lg mx-auto">
          Browse feedback bounties from Stellar founders, complete missions, and
          earn USDC rewards. This board will populate once missions go live.
        </p>
        <Link
          href="/"
          className="text-[#9011FF] hover:text-purple-400 transition-colors"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
