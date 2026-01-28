import React from 'react';
import Image from 'next/image';
import avatar from '../../../public/avatar.png';

interface ResponsePreviewProps {
  id: string;
  respondentName: string;
  respondentAvatar?: string;
  questTitle: string;
  timeSinceSubmission: string;
}

export const ResponsePreview: React.FC<ResponsePreviewProps> = ({
  respondentName,
  respondentAvatar,
  questTitle,
  timeSinceSubmission,
}) => {
  return (
    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-[#1a1a2e]/50 transition-colors cursor-pointer group">
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Image
            src={respondentAvatar || avatar}
            alt={respondentName}
            width={40}
            height={40}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-xs sm:text-sm group-hover:text-purple-400 transition-colors">
            {respondentName}
          </p>
          <p className="text-gray-400 text-xs truncate mt-0.5">
            {questTitle}
          </p>
        </div>
      </div>

      {/* Time */}
      <div className="flex-shrink-0 ml-2 sm:ml-3">
        <span className="text-gray-500 text-xs whitespace-nowrap">{timeSinceSubmission}</span>
      </div>
    </div>
  );
};