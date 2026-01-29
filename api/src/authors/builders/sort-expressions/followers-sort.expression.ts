import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthorSortDirection } from '../../types/authors.types.js';
import type { ISortExpression } from './sort-expression.interface.js';
import { SortUtils } from './sort-utils.js';

export class FollowersSortExpression implements ISortExpression {
  build(order: AuthorSortDirection): Prisma.Sql {
    const directValue = Prisma.sql`
      CASE
        WHEN "Author"."followersCount" IS NOT NULL
        THEN "Author"."followersCount"::numeric
        ELSE NULL
      END
    `;

    const countersValue = SortUtils.buildCounterValueExpression([
      'followers',
      'subscribers',
    ]);

    const expression = Prisma.sql`COALESCE(${directValue}, ${countersValue})`;
    return SortUtils.applyDirection(expression, order, { nullsLast: true });
  }
}
