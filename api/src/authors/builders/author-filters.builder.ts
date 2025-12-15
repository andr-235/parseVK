import { Prisma } from '@prisma/client';

export interface AuthorFiltersResult {
  sqlConditions: Prisma.Sql[];
}

export class AuthorFiltersBuilder {
  buildFilters(
    search: string | null | undefined,
    verified?: boolean,
  ): AuthorFiltersResult {
    const sqlConditions: Prisma.Sql[] = [];

    if (search) {
      sqlConditions.push(this.buildSearchFilter(search));
    }

    if (verified !== undefined) {
      sqlConditions.push(this.buildVerifiedFilter(verified));
    }

    return {
      sqlConditions,
    };
  }

  private buildSearchFilter(search: string): Prisma.Sql {
    const numericId = Number.parseInt(search, 10);
    const searchTerm = `%${search.toLowerCase()}%`;
    const searchSqlParts: Prisma.Sql[] = [
      Prisma.sql`LOWER("Author"."firstName") LIKE ${searchTerm}`,
      Prisma.sql`LOWER("Author"."lastName") LIKE ${searchTerm}`,
      Prisma.sql`LOWER("Author"."domain") LIKE ${searchTerm}`,
      Prisma.sql`LOWER("Author"."screenName") LIKE ${searchTerm}`,
    ];

    if (!Number.isNaN(numericId)) {
      searchSqlParts.push(Prisma.sql`"Author"."vkUserId" = ${numericId}`);
    }

    return Prisma.sql`(${Prisma.join(searchSqlParts, ' OR ')})`;
  }

  private buildVerifiedFilter(verified: boolean): Prisma.Sql {
    if (verified) {
      return Prisma.sql`"Author"."verifiedAt" IS NOT NULL`;
    }

    return Prisma.sql`"Author"."verifiedAt" IS NULL`;
  }
}
