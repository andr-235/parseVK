import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthorSortDirection } from '../../types/authors.types.js';
import type { ISortExpression } from './sort-expression.interface.js';
import { SortUtils } from './sort-utils.js';

type AuthorColumn = 'verifiedAt' | 'updatedAt';

const AUTHOR_COLUMN_SQL: Record<AuthorColumn, Prisma.Sql> = {
  verifiedAt: Prisma.sql`"Author"."verifiedAt"`,
  updatedAt: Prisma.sql`"Author"."updatedAt"`,
};

export class SimpleSortExpression implements ISortExpression {
  constructor(
    private readonly column: AuthorColumn,
    private readonly nullsLast = false,
  ) {}

  build(order: AuthorSortDirection): Prisma.Sql {
    const expression = AUTHOR_COLUMN_SQL[this.column];
    return SortUtils.applyDirection(expression, order, {
      nullsLast: this.nullsLast,
    });
  }
}
