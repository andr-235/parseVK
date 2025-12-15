import { Prisma } from '@prisma/client';
import type { AuthorSortDirection } from '../../types/authors.types';
import type { ISortExpression } from './sort-expression.interface';
import { SortUtils } from './sort-utils';

export class LastSeenSortExpression implements ISortExpression {
  build(order: AuthorSortDirection): Prisma.Sql {
    const trimmedValue = Prisma.sql`NULLIF(trim('"' FROM "Author"."lastSeen"::text), '')`;

    const numericFromRoot = SortUtils.buildUnixMillisExpression(trimmedValue);

    const stringCase = Prisma.sql`
      CASE
        WHEN ${trimmedValue} ~ '^-?\\d+$' THEN ${SortUtils.buildUnixMillisExpression(trimmedValue)}
        WHEN ${trimmedValue} ~ '^\\d{4}-\\d{2}-\\d{2}'
          THEN FLOOR(EXTRACT(EPOCH FROM (${trimmedValue})::timestamptz) * 1000)
        ELSE NULL
      END
    `;

    const timeFromObject = SortUtils.buildUnixMillisExpression(
      Prisma.sql`"Author"."lastSeen"->>'time'`,
    );
    const dateFromObject = Prisma.sql`
      CASE
        WHEN ("Author"."lastSeen"->>'date') ~ '^\\d{4}-\\d{2}-\\d{2}'
        THEN FLOOR(EXTRACT(EPOCH FROM ("Author"."lastSeen"->>'date')::timestamptz) * 1000)
        ELSE NULL
      END
    `;

    const expression = Prisma.sql`
      CASE
        WHEN "Author"."lastSeen" IS NULL THEN NULL
        WHEN jsonb_typeof("Author"."lastSeen") = 'number' THEN ${numericFromRoot}
        WHEN jsonb_typeof("Author"."lastSeen") = 'string' THEN ${stringCase}
        WHEN jsonb_typeof("Author"."lastSeen") = 'object'
          THEN COALESCE(${timeFromObject}, ${dateFromObject})
        ELSE NULL
      END
    `;

    return SortUtils.applyDirection(expression, order, { nullsLast: true });
  }
}
