import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthorSortDirection } from '../../types/authors.types.js';

export interface ISortExpression {
  build(order: AuthorSortDirection): Prisma.Sql;
}
