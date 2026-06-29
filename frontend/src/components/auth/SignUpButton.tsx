'use client';

import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { ONBOARDING_ROUTES } from '@/lib/onboarding';

interface SignUpButtonProps {
  className?: string;
  variant?: 'primary' | 'nav';
}

export default function SignUpButton({
  className = '',
  variant = 'primary',
}: SignUpButtonProps) {
  const router = useRouter();

  const baseStyles =
    variant === 'nav'
      ? 'bg-[#9011FF] rounded-[12px] px-7 py-3 text-lg font-semibold shadow-lg shadow-violet-500/30 hover:bg-purple-700'
      : 'bg-[#9011FF] hover:bg-purple-700 text-white rounded-full px-6 py-2 font-semibold';

  const handleClick = () => {
    router.push(ONBOARDING_ROUTES.signUp);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 text-white transition-colors cursor-pointer ${baseStyles} ${className}`}
    >
      <UserPlus className="h-5 w-5" />
      <span>Sign Up</span>
    </button>
  );
}
