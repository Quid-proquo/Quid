'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletProvider';

interface WalletConnectButtonProps {
  className?: string;
  redirectTo?: string;
  variant?: 'primary' | 'nav';
}

export default function WalletConnectButton({
  className = '',
  redirectTo,
  variant = 'primary',
}: WalletConnectButtonProps) {
  const { connected, connect, disconnect, publicKey, walletName } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (connected) {
        await disconnect();
        return;
      }

      const address = await connect();
      if (address && redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      console.error('Wallet operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const baseStyles =
    variant === 'nav'
      ? 'bg-[#9011FF] rounded-[12px] px-7 py-3 text-lg font-semibold shadow-lg shadow-violet-500/30 hover:bg-purple-700'
      : 'bg-[#9011FF] hover:bg-purple-700 text-white rounded-full px-6 py-2 font-semibold';

  const getLabel = () => {
    if (isLoading) {
      return connected ? 'Disconnecting...' : 'Connecting...';
    }

    if (connected) {
      const shortKey = publicKey
        ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
        : '';
      return walletName ? `${walletName} (${shortKey})` : shortKey;
    }

    return 'Connect Wallet';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-75 ${baseStyles} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Wallet className="h-5 w-5" />
      )}
      <span>{getLabel()}</span>
    </button>
  );
}
