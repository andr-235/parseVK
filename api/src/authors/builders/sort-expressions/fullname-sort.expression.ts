import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthorSortDirection } from '../../types/authors.types.js';
import type { ISortExpression } from './sort-expression.interface.js';
import { SortUtils } from './sort-utils.js';

export class FullNameSortExpression implements ISortExpression {
  build(order: AuthorSortDirection): Prisma.Sql {
    const expressions: Prisma.Sql[] = [
      SortUtils.applyDirection(Prisma.sql`LOWER("Author"."lastName")`, order),
      SortUtils.applyDirection(Prisma.sql`LOWER("Author"."firstName")`, order),
      SortUtils.applyDirection(Prisma.sql`"Author"."vkUserId"`, order),
    ];

    return Prisma.join(expressions, ', ');
  }
}
