import { Prisma } from '@/generated/prisma/client';
import type { SqlFragment } from '../types/authors.types';

export interface AuthorFiltersResult {
  sqlConditions: SqlFragment[];
}

export class AuthorFiltersBuilder {
  buildFilters(
    search: string | null | undefined,
    city: string | null | undefined,
    verified?: boolean,
  ): AuthorFiltersResult {
    const sqlConditions: SqlFragment[] = [];

    const normalizedSearch = this.normalizeSearch(search);
    if (normalizedSearch) {
      sqlConditions.push(this.buildSearchFilter(normalizedSearch));
    }

    if (verified !== undefined) {
      sqlConditions.push(this.buildVerifiedFilter(verified));
    }

    const normalizedCity = this.normalizeSearch(city);
    if (normalizedCity) {
      sqlConditions.push(this.buildCityFilter(normalizedCity));
    }

    return { sqlConditions };
  }

  private normalizeSearch(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private buildSearchFilter(search: string): SqlFragment {
    const lower = search.toLowerCase();
    const likeTerm = `%${lower}%`;

    const searchSqlParts: Prisma.Sql[] = [
      Prisma.sql`LOWER("Author"."firstName") LIKE ${likeTerm}`,
      Prisma.sql`LOWER("Author"."lastName") LIKE ${likeTerm}`,
      Prisma.sql`LOWER("Author"."domain") LIKE ${likeTerm}`,
      Prisma.sql`LOWER("Author"."screenName") LIKE ${likeTerm}`,
    ];

    // Только если search — строго целое число (ID), иначе не считаем
    if (/^\d+$/.test(search)) {
      const numericId = Number(search);
      searchSqlParts.push(Prisma.sql`"Author"."vkUserId" = ${numericId}`);
    }

    return Prisma.sql`(${Prisma.join(searchSqlParts, ' OR ')})`;
  }

  private buildVerifiedFilter(verified: boolean): SqlFragment {
    return verified
      ? Prisma.sql`"Author"."verifiedAt" IS NOT NULL`
      : Prisma.sql`"Author"."verifiedAt" IS NULL`;
  }

  private buildCityFilter(city: string): SqlFragment {
    const likeTerm = `%${city.toLowerCase()}%`;
    const cityValue = Prisma.sql`COALESCE(
      NULLIF("Author"."city"->>'title', ''),
      NULLIF("Author"."city"->>'name', ''),
      NULLIF(TRIM(BOTH '"' FROM "Author"."city"::text), ''),
      NULLIF("Author"."homeTown", '')
    )`;

    return Prisma.sql`LOWER(${cityValue}) LIKE ${likeTerm}`;
  }
}
