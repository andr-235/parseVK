import { Prisma } from '@prisma/client';
import type { AuthorSortDirection } from '../../types/authors.types';
import type { ISortExpression } from './sort-expression.interface';
import { SortUtils } from './sort-utils';

export class SimpleSortExpression implements ISortExpression {
  constructor(
    private readonly column: string,
    private readonly nullsLast = false,
  ) {}

  build(order: AuthorSortDirection): Prisma.Sql {
    const expression = Prisma.sql`"Author"."${Prisma.raw(this.column)}"`;
    return SortUtils.applyDirection(expression, order, {
      nullsLast: this.nullsLast,
    });
  }
}
