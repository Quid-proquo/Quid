'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleSelection from '@/features/onboarding/role-selection';
import { useWallet } from '@/context/WalletProvider';
import { ONBOARDING_ROUTES } from '@/lib/onboarding';

export default function AccountTypePage() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.replace(ONBOARDING_ROUTES.signUp);
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  return <RoleSelection />;
}
