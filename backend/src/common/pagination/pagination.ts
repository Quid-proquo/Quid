import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export class CursorPageQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit?: number;
}

export interface PageDto<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPayload {
  sortKey: string;
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as Partial<CursorPayload>;
    if (typeof parsed.sortKey === 'string' && typeof parsed.id === 'string') {
      return { sortKey: parsed.sortKey, id: parsed.id };
    }
  } catch {
    // fall through to the error below
  }
  throw new BadRequestException('Invalid pagination cursor');
}

/**
 * Fetches `limit + 1` rows through `fetchRows` (ordered by sortKey, id) and
 * builds the standard `{ items, nextCursor, hasMore }` envelope.
 */
export async function paginate<T extends { id: string }>(
  query: CursorPageQueryDto,
  sortKeyOf: (row: T) => string,
  fetchRows: (args: {
    take: number;
    after: CursorPayload | null;
  }) => Promise<T[]>,
): Promise<PageDto<T>> {
  const limit = query.limit ?? DEFAULT_PAGE_LIMIT;
  const after = query.cursor ? decodeCursor(query.cursor) : null;
  const rows = await fetchRows({ take: limit + 1, after });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeCursor({ sortKey: sortKeyOf(last), id: last.id })
        : null,
  };
}
