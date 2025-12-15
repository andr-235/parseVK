import { Prisma } from '@prisma/client';

export interface AuthorFiltersResult {
  where?: Prisma.AuthorWhereInput;
  sqlConditions: Prisma.Sql[];
}

export class AuthorFiltersBuilder {
  buildFilters(
    search: string | null | undefined,
    verified?: boolean,
  ): AuthorFiltersResult {
    const filters: Prisma.AuthorWhereInput[] = [];
    const sqlConditions: Prisma.Sql[] = [];

    if (search) {
      const searchFilters = this.buildSearchFilters(search);
      filters.push(searchFilters.prisma);
      sqlConditions.push(searchFilters.sql);
    }

    if (verified !== undefined) {
      const verifiedFilters = this.buildVerifiedFilters(verified);
      filters.push(verifiedFilters.prisma);
      sqlConditions.push(verifiedFilters.sql);
    }

    const where: Prisma.AuthorWhereInput | undefined = filters.length
      ? { AND: filters }
      : undefined;

    return {
      where,
      sqlConditions,
    };
  }

  private buildSearchFilters(search: string): {
    prisma: Prisma.AuthorWhereInput;
    sql: Prisma.Sql;
  } {
    const numericId = Number.parseInt(search, 10);
    const orFilters: Prisma.AuthorWhereInput[] = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
      { screenName: { contains: search, mode: 'insensitive' } },
    ];

    const searchTerm = `%${search.toLowerCase()}%`;
    const searchSqlParts: Prisma.Sql[] = [
      Prisma.sql`LOWER("Author"."firstName") LIKE ${searchTerm}`,
      Prisma.sql`LOWER("Author"."lastName") LIKE ${searchTerm}`,
      Prisma.sql`LOWER("Author"."domain") LIKE ${searchTerm}`,
      Prisma.sql`LOWER("Author"."screenName") LIKE ${searchTerm}`,
    ];

    if (!Number.isNaN(numericId)) {
      orFilters.push({ vkUserId: numericId });
      searchSqlParts.push(Prisma.sql`"Author"."vkUserId" = ${numericId}`);
    }

    return {
      prisma: { OR: orFilters },
      sql: Prisma.sql`(${Prisma.join(searchSqlParts, ' OR ')})`,
    };
  }

  private buildVerifiedFilters(verified: boolean): {
    prisma: Prisma.AuthorWhereInput;
    sql: Prisma.Sql;
  } {
    if (verified) {
      return {
        prisma: { verifiedAt: { not: null } },
        sql: Prisma.sql`"Author"."verifiedAt" IS NOT NULL`,
      };
    }

    return {
      prisma: { verifiedAt: null },
      sql: Prisma.sql`"Author"."verifiedAt" IS NULL`,
    };
  }
}
