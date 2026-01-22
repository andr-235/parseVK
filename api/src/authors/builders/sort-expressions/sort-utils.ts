import { Prisma } from '@prisma/client';
import { AUTHORS_CONSTANTS } from '../../authors.constants';
import type { AuthorSortDirection } from '../../types/authors.types';

export class SortUtils {
  static applyDirection(
    expression: Prisma.Sql,
    order: AuthorSortDirection,
    options: { nullsLast?: boolean } = {},
  ): Prisma.Sql {
    const direction = order === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const nulls = options.nullsLast ? Prisma.sql` NULLS LAST` : Prisma.sql``;
    return Prisma.sql`${expression} ${direction}${nulls}`;
  }

  static buildCounterValueExpression(keys: string[]): Prisma.Sql {
    const expressions: Prisma.Sql[] = keys.map((key) =>
      this.buildCounterValueExpressionForKey(key),
    );

    if (expressions.length === 1) {
      return expressions[0];
    }

    return Prisma.sql`COALESCE(${Prisma.join(expressions, ', ')})`;
  }

  private static buildCounterValueExpressionForKey(key: string): Prisma.Sql {
    // параметризуем ключ (без Prisma.raw с кавычками)
    const keyParam = Prisma.sql`${key}`;

    const numericPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyParam},
        '$.** ? (@.type() == "number")'
      )
    `;

    const stringPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyParam},
        '$.** ? (@.type() == "string" && @ like_regex "^-?\\\\d+$")'
      )
    `;

    return Prisma.sql`
      CASE
        WHEN jsonb_typeof("Author"."counters"->${keyParam}) = 'number'
          THEN ("Author"."counters"->>${keyParam})::numeric
        WHEN jsonb_typeof("Author"."counters"->${keyParam}) = 'string'
          AND ("Author"."counters"->>${keyParam}) ~ '^-?\\d+$'
          THEN ("Author"."counters"->>${keyParam})::numeric
        WHEN jsonb_typeof("Author"."counters"->${keyParam}) = 'object'
          THEN COALESCE(
            (${numericPath})::text::numeric,
            CASE
              WHEN ${stringPath} IS NOT NULL
              THEN NULLIF(TRIM(BOTH '"' FROM (${stringPath})::text), '')::numeric
              ELSE NULL
            END
          )
        ELSE NULL
      END
    `;
  }

  static buildUnixMillisExpression(value: Prisma.Sql): Prisma.Sql {
    return Prisma.sql`
      CASE
        WHEN ${value} IS NULL THEN NULL
        WHEN ${value} ~ '^-?\\d+$' THEN
          CASE
            WHEN (${value})::numeric > ${AUTHORS_CONSTANTS.MILLISECONDS_THRESHOLD}
              THEN (${value})::numeric
            ELSE (${value})::numeric * 1000
          END
        ELSE NULL
      END
    `;
  }
}
