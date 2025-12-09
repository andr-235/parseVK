import { Prisma } from '@prisma/client';
import { AUTHORS_CONSTANTS } from '../authors.constants';
import type {
  AuthorSortDirection,
  AuthorSortField,
  ResolvedAuthorSort,
} from '../types/authors.types';

export class AuthorSortBuilder {
  buildOrderClause(sort: ResolvedAuthorSort): Prisma.Sql {
    const expressions: Prisma.Sql[] = [this.buildPrimarySortExpression(sort)];
    expressions.push(Prisma.sql`"Author"."updatedAt" DESC` as Prisma.Sql);
    expressions.push(Prisma.sql`"Author"."id" DESC` as Prisma.Sql);

    return Prisma.join(expressions, ', ') as Prisma.Sql;
  }

  private buildPrimarySortExpression(sort: ResolvedAuthorSort): Prisma.Sql {
    const handlers: Record<AuthorSortField, () => Prisma.Sql> = {
      fullName: () => this.buildFullNameSort(sort.order),
      photosCount: () =>
        this.buildCounterSort(['photos', 'photos_count'], sort.order),
      audiosCount: () => this.buildCounterSort(['audios', 'audio'], sort.order),
      videosCount: () => this.buildCounterSort(['videos', 'video'], sort.order),
      friendsCount: () => this.buildCounterSort(['friends'], sort.order),
      followersCount: () => this.buildFollowersSort(sort.order),
      lastSeenAt: () => this.buildLastSeenSort(sort.order),
      verifiedAt: () => this.buildVerifiedAtSort(sort.order),
      updatedAt: () => this.buildUpdatedAtSort(sort.order),
    };

    const handler = handlers[sort.field] ?? handlers.updatedAt;
    return handler() as Prisma.Sql;
  }

  private buildFullNameSort(order: AuthorSortDirection): Prisma.Sql {
    const expressions: Prisma.Sql[] = [
      this.applyDirection(Prisma.sql`LOWER("Author"."lastName")`, order),
      this.applyDirection(Prisma.sql`LOWER("Author"."firstName")`, order),
      this.applyDirection(Prisma.sql`"Author"."vkUserId"`, order),
    ];
    return Prisma.join(expressions, ', ') as Prisma.Sql;
  }

  private buildCounterSort(
    keys: string[],
    order: AuthorSortDirection,
  ): Prisma.Sql {
    const expression = this.buildCounterValueExpression(keys);
    return this.applyDirection(expression, order, { nullsLast: true });
  }

  private buildFollowersSort(order: AuthorSortDirection): Prisma.Sql {
    const expression = this.buildFollowersValueExpression();
    return this.applyDirection(expression, order, { nullsLast: true });
  }

  private buildLastSeenSort(order: AuthorSortDirection): Prisma.Sql {
    const expression = this.buildLastSeenValueExpression();
    return this.applyDirection(expression, order, { nullsLast: true });
  }

  private buildVerifiedAtSort(order: AuthorSortDirection): Prisma.Sql {
    return this.applyDirection(Prisma.sql`"Author"."verifiedAt"`, order, {
      nullsLast: true,
    });
  }

  private buildUpdatedAtSort(order: AuthorSortDirection): Prisma.Sql {
    return this.applyDirection(Prisma.sql`"Author"."updatedAt"`, order);
  }

  private applyDirection(
    expression: Prisma.Sql,
    order: AuthorSortDirection,
    options: { nullsLast?: boolean } = {},
  ): Prisma.Sql {
    const direction = order === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const nulls = options.nullsLast ? Prisma.sql` NULLS LAST` : Prisma.sql``;
    return Prisma.sql`${expression} ${direction}${nulls}` as Prisma.Sql;
  }

  private buildCounterValueExpression(keys: string[]): Prisma.Sql {
    const expressions: Prisma.Sql[] = keys.map((key) =>
      this.buildCounterValueExpressionForKey(key),
    );

    if (expressions.length === 1) {
      return expressions[0] as Prisma.Sql;
    }

    return Prisma.sql`COALESCE(${Prisma.join(expressions, ', ')})` as Prisma.Sql;
  }

  private buildCounterValueExpressionForKey(key: string): Prisma.Sql {
    const keyLiteral = Prisma.raw(`'${key}'`) as Prisma.Sql;

    const numericPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyLiteral},
        '$.** ? (@.type() == "number")'
      )
    ` as Prisma.Sql;

    const stringPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyLiteral},
        '$.** ? (@.type() == "string" && @ like_regex "^-?\\\\d+$")'
      )
    ` as Prisma.Sql;

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
    ` as Prisma.Sql;
  }

  private buildFollowersValueExpression(): Prisma.Sql {
    const directValue = Prisma.sql`
      CASE
        WHEN "Author"."followersCount" IS NOT NULL
        THEN "Author"."followersCount"::numeric
        ELSE NULL
      END
    ` as Prisma.Sql;

    const countersValue = this.buildCounterValueExpression([
      'followers',
      'subscribers',
    ]);

    return Prisma.sql`COALESCE(${directValue}, ${countersValue})` as Prisma.Sql;
  }

  private buildLastSeenValueExpression(): Prisma.Sql {
    const trimmedValue = Prisma.sql`NULLIF(trim('"' FROM "Author"."lastSeen"::text), '')` as Prisma.Sql;

    const numericFromRoot = this.buildUnixMillisExpression(trimmedValue);

    const stringCase = Prisma.sql`
      CASE
        WHEN ${trimmedValue} ~ '^-?\\d+$' THEN ${this.buildUnixMillisExpression(trimmedValue)}
        WHEN ${trimmedValue} ~ '^\\d{4}-\\d{2}-\\d{2}'
          THEN FLOOR(EXTRACT(EPOCH FROM (${trimmedValue})::timestamptz) * 1000)
        ELSE NULL
      END
    ` as Prisma.Sql;

    const timeFromObject = this.buildUnixMillisExpression(
      Prisma.sql`"Author"."lastSeen"->>'time'` as Prisma.Sql,
    );
    const dateFromObject = Prisma.sql`
      CASE
        WHEN ("Author"."lastSeen"->>'date') ~ '^\\d{4}-\\d{2}-\\d{2}'
        THEN FLOOR(EXTRACT(EPOCH FROM ("Author"."lastSeen"->>'date')::timestamptz) * 1000)
        ELSE NULL
      END
    ` as Prisma.Sql;

    return Prisma.sql`
      CASE
        WHEN "Author"."lastSeen" IS NULL THEN NULL
        WHEN jsonb_typeof("Author"."lastSeen") = 'number' THEN ${numericFromRoot}
        WHEN jsonb_typeof("Author"."lastSeen") = 'string' THEN ${stringCase}
        WHEN jsonb_typeof("Author"."lastSeen") = 'object'
          THEN COALESCE(${timeFromObject}, ${dateFromObject})
        ELSE NULL
      END
    ` as Prisma.Sql;
  }

  private buildUnixMillisExpression(value: Prisma.Sql): Prisma.Sql {
    return Prisma.sql`
      CASE
        WHEN ${value} IS NULL THEN NULL
        WHEN ${value} ~ '^-?\\d+$' THEN
          CASE
            WHEN (${value})::numeric > ${AUTHORS_CONSTANTS.MILLISECONDS_THRESHOLD_LEGACY} THEN (${value})::numeric
            ELSE (${value})::numeric * 1000
          END
        ELSE NULL
      END
    ` as Prisma.Sql;
  }
}
