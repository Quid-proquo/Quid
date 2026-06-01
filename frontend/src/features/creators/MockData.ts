export interface Quest {
  id: string;
  title: string;
  category: 'Product' | 'Development' | 'Marketing' | 'Events';
  budget: string;
  dueDate: string;
  submissionCount: {
    current: number;
    total: number;
  };
}

export interface Response {
  id: string;
  respondentName: string;
  respondentAvatar?: string;
  questTitle: string;
  timeSinceSubmission: string;
}

export const mockQuests: Quest[] = [
  {
    id: '1',
    title: 'Download and test the latest Ruze.stellar 2.0',
    category: 'Product',
    budget: '10 XLM (640)',
    dueDate: 'Due in 6d',
    submissionCount: {
      current: 12,
      total: 64,
    },
  },
  {
    id: '2',
    title: 'Review and implement feedback for Ruze.stellar 2.0',
    category: 'Development',
    budget: '10 XLM (640)',
    dueDate: 'Due in 4d',
    submissionCount: {
      current: 12,
      total: 64,
    },
  },
  {
    id: '3',
    title: 'Finalize marketing strategy for Ruze.stellar 2.0',
    category: 'Marketing',
    budget: '10 XLM (640)',
    dueDate: 'Due in 2w',
    submissionCount: {
      current: 12,
      total: 64,
    },
  },
  {
    id: '4',
    title: 'Prepare launch event for Ruze.stellar 2.0',
    category: 'Events',
    budget: '10 XLM (640)',
    dueDate: 'Due in 1w',
    submissionCount: {
      current: 12,
      total: 64,
    },
  },
];

export const mockResponses: Response[] = [
  {
    id: '1',
    respondentName: 'Samuel',
    questTitle: 'Download and test the latest Ruz...',
    timeSinceSubmission: '1 min',
  },
  {
    id: '2',
    respondentName: 'Samuel',
    questTitle: 'Download and test the latest Ruz...',
    timeSinceSubmission: '1 min',
  },
];