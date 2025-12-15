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
    const keyLiteral = Prisma.raw(`'${key}'`);

    const numericPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyLiteral},
        '$.** ? (@.type() == "number")'
      )
    `;

    const stringPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyLiteral},
        '$.** ? (@.type() == "string" && @ like_regex "^-?\\\\d+$")'
      )
    `;

    return Prisma.sql`
      CASE
        WHEN jsonb_typeof("Author"."counters"->${keyLiteral}) = 'number'
          THEN ("Author"."counters"->>${keyLiteral})::numeric
        WHEN jsonb_typeof("Author"."counters"->${keyLiteral}) = 'string'
          AND ("Author"."counters"->>${keyLiteral}) ~ '^-?\\d+$'
          THEN ("Author"."counters"->>${keyLiteral})::numeric
        WHEN jsonb_typeof("Author"."counters"->${keyLiteral}) = 'object'
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
            WHEN (${value})::numeric > ${AUTHORS_CONSTANTS.MILLISECONDS_THRESHOLD} THEN (${value})::numeric
            ELSE (${value})::numeric * 1000
          END
        ELSE NULL
      END
    `;
  }
}
