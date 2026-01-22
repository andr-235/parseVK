import { Prisma } from '@prisma/client';
import type { AuthorSortDirection } from '../../types/authors.types';
import type { ISortExpression } from './sort-expression.interface';
import { SortUtils } from './sort-utils';

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
