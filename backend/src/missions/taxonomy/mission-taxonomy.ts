import { ArrayMaxSize, IsArray, IsIn, IsOptional } from 'class-validator';

export const MISSION_CATEGORIES = [
  'wallet-ux',
  'smart-contracts',
  'defi',
  'payments',
  'mobile',
  'accessibility',
  'security',
  'onboarding',
  'other',
] as const;

export type MissionCategory = (typeof MISSION_CATEGORIES)[number];

export const MAX_MISSION_TAGS = 5;

/** Lowercase, trim, and slugify a free-form label ("Wallet UX" -> "wallet-ux"). */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Maps a free-form category to a known slug, falling back to `other`. */
export function normalizeCategory(value?: string | null): MissionCategory {
  const slug = toSlug(value ?? '');
  return (MISSION_CATEGORIES as readonly string[]).includes(slug)
    ? (slug as MissionCategory)
    : 'other';
}

/** Slugifies, drops empties, de-duplicates and caps tags at MAX_MISSION_TAGS. */
export function normalizeTags(tags: string[] = []): string[] {
  return [...new Set(tags.map(toSlug).filter(Boolean))].slice(
    0,
    MAX_MISSION_TAGS,
  );
}

export class MissionTaxonomyDto {
  @IsOptional()
  @IsIn(MISSION_CATEGORIES)
  category?: MissionCategory;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_MISSION_TAGS)
  tags?: string[];
}
