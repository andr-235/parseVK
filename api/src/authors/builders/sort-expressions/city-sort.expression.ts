import { Prisma } from '@prisma/client';
import type { AuthorSortDirection } from '../../types/authors.types';
import type { ISortExpression } from './sort-expression.interface';
import { SortUtils } from './sort-utils';

export class CitySortExpression implements ISortExpression {
  build(order: AuthorSortDirection): Prisma.Sql {
    const cityFromJson = Prisma.sql`
      CASE
        WHEN "Author"."city" IS NULL THEN NULL
        WHEN jsonb_typeof("Author"."city") = 'object' THEN
          NULLIF(TRIM(COALESCE("Author"."city"->>'title', "Author"."city"->>'name')), '')
        WHEN jsonb_typeof("Author"."city") = 'string' THEN
          NULLIF(TRIM(BOTH '"' FROM ("Author"."city")::text), '')
        ELSE NULL
      END
    `;

    const cityValue = Prisma.sql`
      COALESCE(
        ${cityFromJson},
        NULLIF(TRIM("Author"."homeTown"), '')
      )
    `;

    const normalized = Prisma.sql`LOWER(${cityValue})`;

    return SortUtils.applyDirection(normalized, order, { nullsLast: true });
  }
}
