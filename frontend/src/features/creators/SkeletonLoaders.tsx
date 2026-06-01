import React from 'react';

export const StatsOverviewSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-800/50 animate-pulse"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-gray-700/50 w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <div className="h-8 bg-gray-700/50 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-700/50 rounded w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const QuestCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-800/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="bg-gray-700/50 w-14 h-14 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-3" />
            <div className="flex gap-3">
              <div className="h-6 bg-gray-700/50 rounded w-24" />
              <div className="h-6 bg-gray-700/50 rounded w-24" />
              <div className="h-6 bg-gray-700/50 rounded w-20" />
            </div>
          </div>
        </div>
        <div className="h-8 bg-gray-700/50 rounded w-16" />
      </div>
    </div>
  );
};

export const ResponsePreviewSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg animate-pulse">
      <div className="flex items-center space-x-3 flex-1">
        <div className="bg-gray-700/50 w-10 h-10 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-700/50 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-700/50 rounded w-40" />
        </div>
      </div>
      <div className="h-3 bg-gray-700/50 rounded w-12" />
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-10 bg-gray-700/50 rounded w-48 animate-pulse" />
      </div>

      <StatsOverviewSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-700/50 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-700/50 rounded w-20 animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <QuestCardSkeleton key={i} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-700/50 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-700/50 rounded w-20 animate-pulse" />
          </div>
          <div className="bg-[#1a1a2e]/30 rounded-lg p-4 border border-gray-800/50">
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <ResponsePreviewSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};