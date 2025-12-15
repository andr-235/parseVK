import { Prisma } from '@prisma/client';
import type { AuthorSortDirection } from '../../types/authors.types';

export interface ISortExpression {
  build(order: AuthorSortDirection): Prisma.Sql;
}
