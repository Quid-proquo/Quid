import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-[#1a1a2e] rounded-full p-6 mb-4">
        {icon || <FileText className="w-12 h-12 text-gray-500" />}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

// Specific empty states
export const NoQuestsEmptyState: React.FC<{ onCreateQuest: () => void }> = ({
  onCreateQuest,
}) => {
  return (
    <EmptyState
      title="No Active Quests"
      description="You haven't created any quests yet. Create your first quest to start receiving responses from participants."
      actionLabel="Create Your First Quest"
      onAction={onCreateQuest}
      icon={<FileText className="w-12 h-12 text-purple-500" />}
    />
  );
};

export const NoResponsesEmptyState: React.FC = () => {
  return (
    <EmptyState
      title="No Responses Yet"
      description="You don't have any responses yet. Participants will appear here once they start submitting responses to your quests."
      icon={<FileText className="w-12 h-12 text-blue-500" />}
    />
  );
};