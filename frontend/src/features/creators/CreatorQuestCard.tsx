import React from 'react';
import { Clock } from 'lucide-react';
import Image from 'next/image';

interface CreatorQuestCardProps {
  title: string;
  category: 'Product' | 'Development' | 'Marketing' | 'Events';
  budget: string;
  dueDate: string;
  submissionCount: {
    current: number;
    total: number;
  };
}

const categoryConfig = {
  Product: {
    icon: '📦',
    bgColor: 'bg-[#0C0A14]',
    textColor: 'text-white',
  },
  Development: {
    icon: '💻',
    bgColor: 'bg-[#0C0A14]',
    textColor: 'text-white',
  },
  Marketing: {
    icon: '📢',
    bgColor: 'bg-[#0C0A14]',
    textColor: 'text-white',
  },
  Events: {
    icon: '🎉',
    bgColor: 'bg-[#0C0A14]',
    textColor: 'text-white',
  },
};

export const CreatorQuestCard: React.FC<CreatorQuestCardProps> = ({
  title,
  category,
  budget,
  dueDate,
  submissionCount,
}) => {
  const config = categoryConfig[category];

  return (
    <div className="p-4 sm:p-6 transition-all duration-200 cursor-pointer group">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 w-full">
          <div className="flex-shrink-0">
            <Image 
              src="/namelogo.png"
              alt="Quest Icon"
              width={72}
              height={72}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-base sm:text-lg mb-2 sm:mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
              {title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className={`flex items-center space-x-1 ${config.bgColor} ${config.textColor} px-2 sm:px-3 py-1 `}>
                <span className="text-sm">{config.icon}</span>
                <span className="font-medium whitespace-nowrap">{category}</span>
              </div>
              <div className="flex items-center space-x-1 text-ehite px-2 sm:px-3 py-1 ">
                <span className="text-sm">💰</span>
                <span className="font-medium whitespace-nowrap">{budget}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">{dueDate}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 sm:ml-4 self-start sm:self-center">
          <div className="text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
              {submissionCount.current} / {submissionCount.total}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};