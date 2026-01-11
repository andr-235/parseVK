import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { IAuthorsRepository } from '../interfaces/authors-repository.interface';
import type { AuthorRecord } from '../types/author-record.type';
import type { ResolvedAuthorSort, SqlFragment } from '../types/authors.types';
import { AuthorSortBuilder } from '../builders/author-sort.builder';

@Injectable()
export class AuthorsRepository implements IAuthorsRepository {
  private readonly sortBuilder = new AuthorSortBuilder();

  constructor(private readonly prisma: PrismaService) {}

  async countByFilters(sqlConditions: SqlFragment[]): Promise<number> {
    const whereClause = this.buildWhereClause(sqlConditions);

    const query: Prisma.Sql = Prisma.sql`
      SELECT COUNT(*)::int
      FROM "Author"
      ${whereClause}
    `;

    const result = await this.queryRaw<[{ count: number }]>(query);
    return result[0]?.count ?? 0;
  }

  async findByFilters(params: {
    sqlConditions: SqlFragment[];
    offset: number;
    limit: number;
    sort: ResolvedAuthorSort;
  }): Promise<AuthorRecord[]> {
    const whereClause = this.buildWhereClause(params.sqlConditions);
    const orderClause = this.sortBuilder.buildOrderClause(
      params.sort,
    ) as Prisma.Sql;

    const query: Prisma.Sql = Prisma.sql`
      SELECT *
      FROM "Author"
      ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${params.offset}
      LIMIT ${params.limit}
    `;

    return this.queryRaw<AuthorRecord[]>(query);
  }

  findUnique(where: { vkUserId: number }): Promise<AuthorRecord | null> {
    return this.prisma.author.findUnique({ where });
  }

  queryRaw<T = AuthorRecord[]>(query: SqlFragment): Promise<T> {
    return this.prisma.$queryRaw<T>(query as Prisma.Sql);
  }

  private buildWhereClause(sqlConditions: SqlFragment[]): Prisma.Sql {
    const conditions = sqlConditions as Prisma.Sql[];
    return conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.sql``;
  }
}
