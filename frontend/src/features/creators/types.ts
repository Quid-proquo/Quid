export type QuestCategory = 'Product' | 'Development' | 'Marketing' | 'Events';

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  budget: string;
  dueDate: string;
  submissionCount: {
    current: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Response {
  id: string;
  questId: string;
  respondentName: string;
  respondentAvatar?: string;
  questTitle: string;
  timeSinceSubmission: string;
  submittedAt: Date;
}

export interface DashboardStats {
  activeQuests: number;
  totalResponses: number;
  totalRewards: number;
}

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  walletBalance: number;
}