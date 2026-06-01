import React from 'react';
import Image from 'next/image';
import UserIcon from '../../../public/statsoverview/User.png';
import PaperIcon from '../../../public/statsoverview/Paper.png';
import WalletIcon from '../../../public/statsoverview/Wallet.png';

interface StatsOverviewProps {
  activeQuests: number;
  totalResponses: number;
  totalRewards: number;
  onCreateQuest?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  activeQuests,
  totalResponses,
  totalRewards,
  onCreateQuest,
}) => {
  const stats = [
    {
      icon: PaperIcon,
      label: 'Active Quests',
      value: activeQuests,
      bgColor: 'bg-purple-500/10',
      glowColor: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]',
    },
    {
      icon: UserIcon,
      label: 'Total response',
      value: totalResponses,
      bgColor: 'bg-blue-500/10',
      glowColor: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    },
    {
      icon: WalletIcon,
      label: 'Total response',
      value: `${totalRewards.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
      bgColor: 'bg-yellow-500/10',
      glowColor: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]',
    },
  ];

  return (
    <div className="border-t border-b border-[#241B4A] py-6 mb-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-8 lg:gap-12 flex-1">
          {stats.map((stat, index) => {
            return (
              <React.Fragment key={index}>
                <div className="flex items-center space-x-3">
                  <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                    <Image 
                      src={stat.icon}
                      alt={stat.label}
                      width={20}
                      height={20}
                      className={`w-5 h-5 ${stat.glowColor}`}
                    />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {typeof stat.value === 'number' ? stat.value : stat.value.split(' ')[0]}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                </div>
                
                {index < stats.length - 1 && (
                  <div className="hidden sm:block w-px h-12 bg-purple-500/30" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Create New Survey Button */}
        <button
          onClick={onCreateQuest}
          className="bg-[#9011FF] hover:bg-purple-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 flex items-center justify-center space-x-2 group"
        >
          <span className="text-base">Create a New Survey</span>
        </button>
      </div>
    </div>
  );
};