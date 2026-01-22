'use client';

import { useState, useEffect } from 'react';
import Onboarding from '@/components/Onboarding';

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<'earner' | 'business' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRoleSelect = (role: 'earner' | 'business') => {
    setSelectedRole(role);

    // Check if user has already completed onboarding for this role
    const hasOnboarded = localStorage.getItem(`hasOnboarded_${role}`) === 'true';

    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Continue with post-onboarding flow
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quid</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedRole ? `Selected Role: ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : 'Welcome'}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {!selectedRole ? (
          // Role Selection Screen
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Select Your Role
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                Choose how you'd like to get started with Quid. You can change your role anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
              {/* Earner Card */}
              <button
                onClick={() => handleRoleSelect('earner')}
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-transparent hover:border-blue-500 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 rounded-full group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Earner
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                  Find opportunities and earn money by completing tasks
                </p>
              </button>

              {/* Business Card */}
              <button
                onClick={() => handleRoleSelect('business')}
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-transparent hover:border-purple-500 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="mb-4 p-4 bg-purple-100 dark:bg-purple-900 rounded-full group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-purple-600 dark:text-purple-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm0-5h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H4c-.55 0-1 .45-1 1v3h18v-3c0-.55-.45-1-1-1zm-6-1V6c0-1.66 1.34-3 3-3s3 1.34 3 3v1h-6z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Business
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                  Post tasks and hire skilled workers to get work done
                </p>
              </button>
            </div>
          </div>
        ) : (
          // Post-Selection Screen
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center">
              <div className="mb-6 inline-flex p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg
                  className="w-12 h-12 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Role Selected!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You've selected <span className="font-semibold text-blue-600">{selectedRole === 'earner' ? 'Earner' : 'Business'}</span> role.
              </p>
              {!showOnboarding && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  (Onboarding already completed for this role)
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedRole(null);
                setShowOnboarding(false);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Select Different Role
            </button>

            {/* Info Display */}
            <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Onboarding Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Role:</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Onboarding Shown:</span>
                  <span className="font-medium">{showOnboarding ? '✓ Yes' : '✗ No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="font-medium">
                    {localStorage.getItem(`hasOnboarded_${selectedRole}`) === 'true' ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && selectedRole && (
        <Onboarding role={selectedRole} onComplete={handleOnboardingComplete} />
      )}
    </main>
  );
}
