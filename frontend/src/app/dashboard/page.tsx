'use client';

import { useState, useEffect } from 'react';
import { Wallet, ArrowRight, AlertCircle, X, Bell, ChevronDown, Menu } from 'lucide-react';
import Image from 'next/image';
import { StatsOverview } from '@/features/creator/StatsOverview';
import { CreatorQuestCard } from '@/features/creator/CreatorQuestCard';
import { ResponsePreview } from '@/features/creator/ResponsePreview';
import { DashboardSkeleton } from '@/features/creator/SkeletonLoaders';
import { NoQuestsEmptyState, NoResponsesEmptyState } from '@/features/creator/EmptyState';
import { mockQuests, mockResponses, Quest, Response } from '@/features/creator/mockData';

interface DashboardState {
  loading: boolean;
  error: string | null;
  quests: Quest[];
  responses: Response[];
  stats: {
    activeQuests: number;
    totalResponses: number;
    totalRewards: number;
  };
}

export default function CreatorDashboard() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    quests: [],
    responses: [],
    stats: {
      activeQuests: 0,
      totalResponses: 0,
      totalRewards: 0,
    },
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        setState({
          loading: false,
          error: null,
          quests: mockQuests,
          responses: mockResponses,
          stats: {
            activeQuests: 12,
            totalResponses: 48,
            totalRewards: 2150.02,
          },
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data. Please try again.',
        }));
      }
    };

    fetchDashboardData();
  }, []);

  const handleCreateQuest = () => {
    console.log('Create new quest');
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1e] text-white">
        <DashboardHeader 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="flex">
          <div className="flex flex-col lg:flex-row flex-1">
            <DesktopSidebar />
            <main className="flex-1 min-w-0 w-full px-4 sm:px-5 md:px-6">
              <DashboardSkeleton />
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-[#0f0f1e] text-white">
        <DashboardHeader 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="flex">
          <div className="flex flex-col lg:flex-row flex-1">
            <DesktopSidebar />
            <main className="flex-1 min-w-0 w-full px-4 sm:px-5 md:px-6">
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Error Loading Dashboard</h2>
                <p className="text-gray-400 text-center mb-6 text-sm sm:text-base">{state.error}</p>
                <button
                  onClick={handleRetry}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base"
                >
                  Try Again
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white">
      <DashboardHeader 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed top-14 sm:top-16 left-0 bottom-0 w-64 sm:w-72 bg-[#1a1a2e] z-50 transform transition-transform duration-300 lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <MobileSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex">
        <div className="flex flex-col lg:flex-row flex-1">
          <DesktopSidebar />

          <main className="flex-1 min-w-0 w-full px-4 sm:px-5 md:px-6">
            <StatsOverview
              activeQuests={state.stats.activeQuests}
              totalResponses={state.stats.totalResponses}
              totalRewards={state.stats.totalRewards}
              onCreateQuest={handleCreateQuest}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Active Quests Section */}
              <div className="lg:col-span-2 order-1 lg:border-r lg:border-purple-500/30 lg:pr-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Active Quests</h2>
                  <button className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group">
                    <span>View all</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {state.quests.length === 0 ? (
                  <NoQuestsEmptyState onCreateQuest={handleCreateQuest} />
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {state.quests.map((quest) => (
                      <CreatorQuestCard
                        key={quest.id}
                        title={quest.title}
                        category={quest.category}
                        budget={quest.budget}
                        dueDate={quest.dueDate}
                        submissionCount={quest.submissionCount}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Responses Section */}
              <div className="lg:col-span-1 order-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Recent Response</h2>
                  <button className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group">
                    <span>View all</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {state.responses.length === 0 ? (
                  <NoResponsesEmptyState />
                ) : (
                  <div className="p-3 sm:p-4">
                    <div className="space-y-2">
                      {state.responses.map((response) => (
                        <ResponsePreview
                          key={response.id}
                          id={response.id}
                          respondentName={response.respondentName}
                          respondentAvatar={response.respondentAvatar}
                          questTitle={response.questTitle}
                          timeSinceSubmission={response.timeSinceSubmission}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


function DashboardHeader({ isMobileMenuOpen, setIsMobileMenuOpen, setIsSidebarOpen }: { 
  isMobileMenuOpen: boolean; 
  setIsMobileMenuOpen: (open: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#0f0f1e]">
      <div className="flex h-14 sm:h-16">
        <div className="hidden lg:flex bg-[#1a1a2e]">
          <div className="flex items-center justify-center px-6">
            <Image 
              src="/quid.svg"
              alt="Quid Logo" 
              width={40} 
              height={40}
              className="w-10 h-10"
              priority
            />
          </div>

          <div className="w-30 flex items-center px-6">
            <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Creators
            </button>
          </div>
        </div>

        {/* Mobile Logo - Visible only on mobile */}
        <div className="flex lg:hidden items-center px-4">
          <Image 
            src="/quid.svg"
            alt="Quid Logo" 
            width={32} 
            height={32}
            className="w-7 h-7"
            priority
          />
        </div>

        <div className="flex-1 flex items-center justify-between px-4 sm:px-6">
          {/* Dashboard button - Hidden on mobile */}
          <button className="hidden lg:block text-sm font-medium text-white">
            Dashboard
          </button>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <button className="p-1.5 sm:p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
            <div className="px-2 py-1 sm:px-3 sm:py-1.5 flex items-center space-x-1.5 sm:space-x-2">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <span className="text-xs sm:text-sm font-medium">$0</span>
            </div>
            <button className="hidden sm:flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-800/50 rounded-lg transition-colors">
              <span className="text-sm font-medium">Ruze.stellar</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Desktop sidebar component
function DesktopSidebar() {
  return (
    <aside className="hidden lg:block w-52 flex-shrink-0 bg-[#1a1a2e]">
      <div className="px-6 py-8">
        <nav className="space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-[#1B1540] text-purple-400 rounded-sm font-medium transition-colors border-l-4 border-purple-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-gray-800/20 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Quests</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-gray-800/20 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Wallet</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}

// Mobile sidebar component
function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Menu</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      <nav className="space-y-1 flex-1">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-purple-500/10 text-purple-400 rounded-lg font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-gray-800/30 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Quests</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-gray-800/30 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Wallet</span>
        </button>
      </nav>
    </div>
  );
}