import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildTimeline,
  getSubmissionAction,
  getSubmissionTab,
  type SubmissionStatus,
} from './submission-status';

const statuses: SubmissionStatus[] = [
  'PENDING',
  'APPROVED',
  'PAID',
  'REJECTED',
  'DISPUTED',
];

describe('getSubmissionAction', () => {
  it('maps every status to a primary action', () => {
    const expected: Record<SubmissionStatus, string> = {
      PENDING: 'View report',
      APPROVED: 'Claim payout',
      PAID: 'View payment',
      REJECTED: 'Dispute decision',
      DISPUTED: 'View dispute',
    };

    for (const status of statuses) {
      assert.equal(
        getSubmissionAction({ id: status, status }).label,
        expected[status],
      );
    }
  });

  it('prioritises replying to unread comments while in review', () => {
    const action = getSubmissionAction({
      id: 's1',
      status: 'PENDING',
      unreadCommentCount: 2,
    });

    assert.equal(action.kind, 'reply');
    assert.equal(action.label, 'Reply to comment');
  });
});

describe('getSubmissionTab', () => {
  it('groups each status under the matching tab', () => {
    const expected = {
      PENDING: 'review',
      APPROVED: 'approved',
      PAID: 'paid',
      REJECTED: 'rejected',
      DISPUTED: 'disputed',
    };

    for (const status of statuses) {
      assert.equal(getSubmissionTab(status), expected[status]);
    }
  });
});

describe('buildTimeline', () => {
  it('marks every step complete for a paid report', () => {
    const steps = buildTimeline({
      id: 's1',
      status: 'PAID',
      txHash: 'abc123',
      chainConfirmed: true,
    });

    assert.deepEqual(
      steps.map((step) => step.state),
      ['complete', 'complete', 'complete', 'complete'],
    );
    assert.match(steps[3].href ?? '', /\/tx\/abc123$/);
  });

  it('flags a failed proof and leaves later steps upcoming', () => {
    const steps = buildTimeline({
      id: 's2',
      status: 'PENDING',
      proofStatus: 'FAILED',
    });

    assert.equal(steps[1].state, 'failed');
    assert.equal(steps[2].state, 'upcoming');
    assert.equal(steps[3].state, 'upcoming');
  });
});
