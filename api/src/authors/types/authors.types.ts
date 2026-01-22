import type { Prisma } from '@prisma/client';

/**
 * Prisma.Sql совместим с Prisma.sql`...` и Prisma.join(...)
 * Это то, что реально используется в репозитории.
 */
export type SqlFragment = Prisma.Sql;

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

  /**
   * Важно: делаем строго boolean | undefined.
   * Никаких 'true'/'1' тут быть не должно — это зона контроллера/пайпа.
   */
  verified?: boolean;

  sortBy?: AuthorSortField | null;
  sortOrder?: AuthorSortDirection | null;
}

export interface ResolvedAuthorSort {
  field: AuthorSortField;
  order: AuthorSortDirection;
}

export interface QueryAuthorsOptions {
  sqlConditions: SqlFragment[];
  offset: number;
  limit: number;
  sort: ResolvedAuthorSort;
}
