import React from 'react';

interface IconProps {
  className?: string;
}

export const WelcomeIcon: React.FC<IconProps> = ({ className = 'w-16 h-16' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" fill="rgba(59, 130, 246, 0.1)" />
    <path d="M32 20V44M20 32H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="32" r="2" fill="currentColor" />
  </svg>
);

export const EarnerIcon: React.FC<IconProps> = ({ className = 'w-16 h-16' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" fill="rgba(34, 197, 94, 0.1)" />
    <path d="M32 16C28.68 16 26 18.68 26 22C26 25.32 28.68 28 32 28C35.32 28 38 25.32 38 22C38 18.68 35.32 16 32 16Z" fill="currentColor" />
    <path d="M22 44C22 38.48 26.48 34 32 34C37.52 34 42 38.48 42 44H22Z" fill="currentColor" />
  </svg>
);

export const JobsIcon: React.FC<IconProps> = ({ className = 'w-16 h-16' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="20" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M24 20V16C24 14.9 24.9 14 26 14H38C39.1 14 40 14.9 40 16V20" stroke="currentColor" strokeWidth="2" />
    <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="2" />
    <circle cx="24" cy="36" r="1.5" fill="currentColor" />
    <circle cx="32" cy="36" r="1.5" fill="currentColor" />
    <circle cx="40" cy="36" r="1.5" fill="currentColor" />
  </svg>
);

export const PaymentIcon: React.FC<IconProps> = ({ className = 'w-16 h-16' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="20" width="36" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="rgba(59, 130, 246, 0.1)" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <line x1="14" y1="26" x2="50" y2="26" stroke="currentColor" strokeWidth="2" />
    <path d="M20 48H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BusinessIcon: React.FC<IconProps> = ({ className = 'w-16 h-16' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="18" width="32" height="30" rx="2" stroke="currentColor" strokeWidth="2" fill="rgba(168, 85, 247, 0.1)" />
    <line x1="24" y1="18" x2="24" y2="48" stroke="currentColor" strokeWidth="2" />
    <line x1="40" y1="18" x2="40" y2="48" stroke="currentColor" strokeWidth="2" />
    <line x1="16" y1="26" x2="48" y2="26" stroke="currentColor" strokeWidth="2" />
    <line x1="16" y1="34" x2="48" y2="34" stroke="currentColor" strokeWidth="2" />
    <circle cx="20" cy="22" r="1.5" fill="currentColor" />
    <circle cx="20" cy="30" r="1.5" fill="currentColor" />
    <circle cx="20" cy="38" r="1.5" fill="currentColor" />
  </svg>
);

export const PostIcon: React.FC<IconProps> = ({ className = 'w-16 h-16' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 16H44C45.1 16 46 16.9 46 18V46C46 47.1 45.1 48 44 48H20C18.9 48 18 47.1 18 46V18C18 16.9 18.9 16 20 16Z" stroke="currentColor" strokeWidth="2" fill="rgba(251, 146, 60, 0.1)" />
    <path d="M28 28L32 32L44 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ReviewIcon: React.FC<IconProps> = ({ className = 'w-16 h-16' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 16C23.16 16 16 23.16 16 32C16 40.84 23.16 48 32 48C40.84 48 48 40.84 48 32C48 23.16 40.84 16 32 16Z" stroke="currentColor" strokeWidth="2" fill="rgba(34, 197, 94, 0.1)" />
    <path d="M26 32L30 36L38 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ProgressDots: React.FC<{ current: number; total: number; className?: string }> = ({
  current,
  total,
  className = '',
}) => (
  <div className={`flex gap-2 justify-center ${className}`}>
    {Array.from({ length: total }).map((_, index) => (
      <button
        key={index}
        className={`h-2 rounded-full transition-all ${
          index === current
            ? 'bg-blue-600 w-6'
            : index < current
              ? 'bg-blue-400 w-2'
              : 'bg-gray-300 w-2'
        }`}
        aria-label={`Step ${index + 1} of ${total}`}
        disabled
        aria-current={index === current}
      />
    ))}
  </div>
);
