import type { AuthorRecord } from '../types/author-record.type';
import type { ResolvedAuthorSort, SqlFragment } from '../types/authors.types';

export interface IAuthorsRepository {
  countByFilters(sqlConditions: SqlFragment[]): Promise<number>;
  findByFilters(params: {
    sqlConditions: SqlFragment[];
    offset: number;
    limit: number;
    sort: ResolvedAuthorSort;
  }): Promise<AuthorRecord[]>;
  findUnique(where: { vkUserId: number }): Promise<AuthorRecord | null>;
  queryRaw<T = AuthorRecord[]>(query: SqlFragment): Promise<T>;
  deleteAuthorAndComments(vkUserId: number): Promise<void>;
}
