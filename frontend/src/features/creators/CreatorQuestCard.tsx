import React from 'react';
import Image from 'next/image';
import briefcaseIcon from '../../../public/quest-detail/briefcase-icon.png';
import stellarIcon from '../../../public/quest-detail/stellar-icon.png';

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
    textColor: 'text-white',
  },
  Development: {
    textColor: 'text-white',
  },
  Marketing: {
    textColor: 'text-white',
  },
  Events: {
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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 pb-4 cursor-pointer hover:bg-neutral-800 transition-colors group">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-4">
        <Image 
          src="/namelogo.png"
          alt="Quest Icon"
          width={72}
          height={72}
        />

        <div className="flex flex-col gap-3">
          <h4 className="text-white font-medium text-base group-hover:text-purple-400 transition-colors">
            {title}
          </h4>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Image 
                src={briefcaseIcon}
                alt="Category"
                width={12.67}
                height={12.67}
                className="w-[12.67px] h-[12.67px]"
              />
              <span className="text-white">{category}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Image 
                src={stellarIcon}
                alt="Budget"
                width={12.67}
                height={12.67}
                className="w-[12.67px] h-[12.67px]"
              />
              <span className="text-white">{budget}</span>
            </div>
            <span className="text-xs text-[#8C86B8]">{dueDate}</span>
          </div>
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
        {submissionCount.current} / {submissionCount.total}
      </div>
    </div>
  );
};