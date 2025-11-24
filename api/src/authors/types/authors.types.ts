import { Prisma } from '@prisma/client';

export type AuthorSortField =
  | 'fullName'
  | 'photosCount'
  | 'audiosCount'
  | 'videosCount'
  | 'friendsCount'
  | 'followersCount'
  | 'lastSeenAt'
  | 'verifiedAt'
  | 'updatedAt';

export type AuthorSortDirection = 'asc' | 'desc';

export interface ListAuthorsOptions {
  offset?: number;
  limit?: number;
  search?: string | null;
  verified?: boolean;
  sortBy?: AuthorSortField | string | null;
  sortOrder?: AuthorSortDirection | string | null;
}

export interface ResolvedAuthorSort {
  field: AuthorSortField;
  order: AuthorSortDirection;
}

export interface QueryAuthorsOptions {
  sqlConditions: Prisma.Sql[];
  offset: number;
  limit: number;
  sort: ResolvedAuthorSort;
}

