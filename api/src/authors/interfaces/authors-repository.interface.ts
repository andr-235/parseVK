import type { AuthorRecord } from '../types/author-record.type';
import type { QueryAuthorsOptions, SqlFragment } from '../types/authors.types';

export interface IAuthorsRepository {
  countByFilters(sqlConditions: SqlFragment[]): Promise<number>;

  findByFilters(params: QueryAuthorsOptions): Promise<AuthorRecord[]>;

  findUnique(where: { vkUserId: number }): Promise<AuthorRecord | null>;

  deleteAuthorAndComments(vkUserId: number): Promise<void>;

  markAuthorVerified(vkUserId: number, verifiedAt: Date): Promise<Date>;
}
