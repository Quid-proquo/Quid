export type SubmissionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED'
  | 'DISPUTED';

export type SubmissionTab =
  | 'review'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'disputed';

export interface SubmissionSummary {
  id: string;
  status: SubmissionStatus;
  txHash?: string | null;
  chainConfirmed?: boolean;
  proofStatus?: 'PENDING' | 'VERIFIED' | 'FAILED';
  unreadCommentCount?: number;
  updatedAt?: string;
}

export interface SubmissionAction {
  label: string;
  kind: 'link' | 'claim' | 'dispute' | 'reply';
  href?: string;
}

export interface TimelineStep {
  key: 'submitted' | 'proof' | 'approved' | 'paid';
  label: string;
  description: string;
  state: 'complete' | 'current' | 'upcoming' | 'failed';
  href?: string;
}

export const SUBMISSION_TABS: Array<{
  id: SubmissionTab;
  label: string;
  statuses: SubmissionStatus[];
}> = [
  { id: 'review', label: 'In review', statuses: ['PENDING'] },
  { id: 'approved', label: 'Approved', statuses: ['APPROVED'] },
  { id: 'paid', label: 'Paid', statuses: ['PAID'] },
  { id: 'rejected', label: 'Rejected', statuses: ['REJECTED'] },
  { id: 'disputed', label: 'Disputed', statuses: ['DISPUTED'] },
];

export function explorerTxUrl(hash: string | null | undefined): string {
  if (!hash) return '#';
  const base =
    process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL ??
    'https://stellar.expert/explorer/testnet';
  return `${base.replace(/\/$/, '')}/tx/${hash}`;
}

export function getSubmissionTab(status: SubmissionStatus): SubmissionTab {
  return (
    SUBMISSION_TABS.find((tab) => tab.statuses.includes(status))?.id ?? 'review'
  );
}

export function getSubmissionAction(
  submission: SubmissionSummary,
): SubmissionAction {
  switch (submission.status) {
    case 'PENDING':
      return submission.unreadCommentCount && submission.unreadCommentCount > 0
        ? { label: 'Reply to comment', kind: 'reply' }
        : { label: 'View report', kind: 'link' };
    case 'APPROVED':
      return { label: 'Claim payout', kind: 'claim' };
    case 'PAID':
      return {
        label: 'View payment',
        kind: 'link',
        href: explorerTxUrl(submission.txHash),
      };
    case 'REJECTED':
      return { label: 'Dispute decision', kind: 'dispute' };
    case 'DISPUTED':
      return { label: 'View dispute', kind: 'link' };
  }
}

export function buildTimeline(submission: SubmissionSummary): TimelineStep[] {
  const proofVerified =
    submission.proofStatus === 'VERIFIED' || submission.chainConfirmed === true;
  const proofFailed = submission.proofStatus === 'FAILED';
  const approved =
    submission.status === 'APPROVED' || submission.status === 'PAID';
  const paid = submission.status === 'PAID';
  const txHref = explorerTxUrl(submission.txHash);

  const proofState: TimelineStep['state'] = proofFailed
    ? 'failed'
    : proofVerified
      ? 'complete'
      : 'current';

  return [
    {
      key: 'submitted',
      label: 'Submitted',
      description: 'Report recorded on-chain',
      state: 'complete',
      href: submission.txHash ? txHref : undefined,
    },
    {
      key: 'proof',
      label: 'Proof verified',
      description: proofFailed
        ? 'Proof-of-Test failed'
        : proofVerified
          ? 'Proof-of-Test passed'
          : 'Waiting for Proof-of-Test',
      state: proofState,
      href: proofVerified && submission.txHash ? txHref : undefined,
    },
    {
      key: 'approved',
      label: 'Approved',
      description: approved ? 'Creator approved the payout' : 'Awaiting review',
      state: approved ? 'complete' : 'upcoming',
    },
    {
      key: 'paid',
      label: 'Paid',
      description: paid ? 'Reward sent to your wallet' : 'Payout not sent yet',
      state: paid ? 'complete' : 'upcoming',
      href: paid && submission.txHash ? txHref : undefined,
    },
  ];
}
