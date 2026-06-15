import { Prisma } from '../../generated/prisma/client.js';
export class AuthorFiltersBuilder {
    buildFilters(search, city, verified) {
        const sqlConditions = [];
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
    normalizeSearch(value) {
        const trimmed = value?.trim();
        return trimmed ? trimmed : null;
    }
    buildSearchFilter(search) {
        const lower = search.toLowerCase();
        const likeTerm = `%${lower}%`;
        const searchSqlParts = [
            Prisma.sql `LOWER("Author"."firstName") LIKE ${likeTerm}`,
            Prisma.sql `LOWER("Author"."lastName") LIKE ${likeTerm}`,
            Prisma.sql `LOWER("Author"."domain") LIKE ${likeTerm}`,
            Prisma.sql `LOWER("Author"."screenName") LIKE ${likeTerm}`,
        ];
        if (/^\d+$/.test(search)) {
            const numericId = Number(search);
            searchSqlParts.push(Prisma.sql `"Author"."vkUserId" = ${numericId}`);
        }
        return Prisma.sql `(${Prisma.join(searchSqlParts, ' OR ')})`;
    }
    buildVerifiedFilter(verified) {
        return verified
            ? Prisma.sql `"Author"."verifiedAt" IS NOT NULL`
            : Prisma.sql `"Author"."verifiedAt" IS NULL`;
    }
    buildCityFilter(city) {
        const likeTerm = `%${city.toLowerCase()}%`;
        const cityValue = Prisma.sql `COALESCE(
      NULLIF("Author"."city"->>'title', ''),
      NULLIF("Author"."city"->>'name', ''),
      NULLIF(TRIM(BOTH '"' FROM "Author"."city"::text), ''),
      NULLIF("Author"."homeTown", '')
    )`;
        return Prisma.sql `LOWER(${cityValue}) LIKE ${likeTerm}`;
    }
}
//# sourceMappingURL=author-filters.builder.js.map