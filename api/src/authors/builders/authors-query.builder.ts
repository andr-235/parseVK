import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Author } from '@prisma/client';
import type { ResolvedAuthorSort } from '../types/authors.types';
import { AuthorSortBuilder } from './author-sort.builder';
import type { IAuthorsRepository } from '../interfaces/authors-repository.interface';

export interface QueryAuthorsOptions {
  sqlConditions: Prisma.Sql[];
  offset: number;
  limit: number;
  sort: ResolvedAuthorSort;
}

@Injectable()
export class AuthorsQueryBuilder {
  private readonly sortBuilder = new AuthorSortBuilder();

  constructor(private readonly repository: IAuthorsRepository) {}

  buildWhereClause(sqlConditions: Prisma.Sql[]): Prisma.Sql {
    return sqlConditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(sqlConditions, ' AND ')}`
      : Prisma.sql``;
  }

  async countAuthors(sqlConditions: Prisma.Sql[]): Promise<number> {
    const whereClause = this.buildWhereClause(sqlConditions);

    const query: Prisma.Sql = Prisma.sql`
      SELECT COUNT(*)::int
      FROM "Author"
      ${whereClause}
    `;

    const result = await this.repository.queryRaw<[{ count: number }]>(query);
    return result[0]?.count ?? 0;
  }

  queryAuthors(options: QueryAuthorsOptions): Promise<Author[]> {
    const whereClause = this.buildWhereClause(options.sqlConditions);
    const orderClause = this.sortBuilder.buildOrderClause(options.sort);

    const query: Prisma.Sql = Prisma.sql`
      SELECT *
      FROM "Author"
      ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${options.offset}
      LIMIT ${options.limit}
    `;

    return this.repository.queryRaw<Author[]>(query);
  }
}
