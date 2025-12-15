import type { AuthorSortField } from './types/authors.types';

export const AUTHORS_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MAX_RECURSION_DEPTH: 4,
  MILLISECONDS_THRESHOLD: 10_000_000_000,
} as const;

export const SORTABLE_FIELDS: ReadonlySet<AuthorSortField> =
  new Set<AuthorSortField>([
    'fullName',
    'photosCount',
    'audiosCount',
    'videosCount',
    'friendsCount',
    'followersCount',
    'lastSeenAt',
    'verifiedAt',
    'updatedAt',
  ]);
