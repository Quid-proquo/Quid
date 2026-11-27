import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface SubmissionComment {
  id: string;
  submissionId: string;
  author: string;
  body: string;
  attachments: string[];
  createdAt: Date;
  editedAt: Date | null;
}

export const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;

const SELECT = `id, submission_id AS "submissionId", author, body, attachments,
  created_at AS "createdAt", edited_at AS "editedAt"`;

/**
 * Private comment thread per submission. Only the mission owner and the
 * submitting hunter can read or write; everyone else gets 404.
 */
@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParticipant(submissionId: string, address: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { mission: { select: { ownerAddress: true } } },
    });
    if (
      !submission ||
      (submission.hunterAddress !== address &&
        submission.mission.ownerAddress !== address)
    ) {
      throw new NotFoundException('Submission not found');
    }
  }

  async list(submissionId: string, address: string, cursor?: string, limit = 50) {
    await this.assertParticipant(submissionId, address);
    const take = Math.min(Math.max(limit, 1), 100);
    const rows = await this.prisma.$queryRawUnsafe<SubmissionComment[]>(
      `SELECT ${SELECT} FROM submission_comments
       WHERE submission_id = $1 AND ($2::timestamp IS NULL OR created_at > $2::timestamp)
       ORDER BY created_at ASC LIMIT $3`,
      submissionId,
      cursor ?? null,
      take,
    );
    const last = rows[rows.length - 1];
    return {
      items: rows,
      nextCursor: rows.length === take && last ? last.createdAt.toISOString() : null,
    };
  }

  async create(
    submissionId: string,
    address: string,
    body: string,
    attachments: string[] = [],
  ) {
    await this.assertParticipant(submissionId, address);
    const rows = await this.prisma.$queryRawUnsafe<SubmissionComment[]>(
      `INSERT INTO submission_comments (id, submission_id, author, body, attachments)
       VALUES ($1, $2, $3, $4, $5::text[]) RETURNING ${SELECT}`,
      randomUUID(),
      submissionId,
      address,
      body,
      attachments,
    );
    return rows[0];
  }

  async edit(
    submissionId: string,
    commentId: string,
    address: string,
    body: string,
    now = new Date(),
  ) {
    await this.assertParticipant(submissionId, address);
    const found = await this.prisma.$queryRawUnsafe<SubmissionComment[]>(
      `SELECT ${SELECT} FROM submission_comments WHERE id = $1 AND submission_id = $2`,
      commentId,
      submissionId,
    );
    const comment = found[0];
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author !== address) {
      throw new ForbiddenException('Only the author can edit a comment');
    }
    if (now.getTime() - new Date(comment.createdAt).getTime() > COMMENT_EDIT_WINDOW_MS) {
      throw new ForbiddenException('Edit window has expired');
    }
    const rows = await this.prisma.$queryRawUnsafe<SubmissionComment[]>(
      `UPDATE submission_comments SET body = $1, edited_at = $2
       WHERE id = $3 RETURNING ${SELECT}`,
      body,
      now,
      commentId,
    );
    return rows[0];
  }
}
