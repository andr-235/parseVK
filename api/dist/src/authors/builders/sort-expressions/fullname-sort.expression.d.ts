import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthorSortDirection } from '../../types/authors.types.js';
import type { ISortExpression } from './sort-expression.interface.js';
export declare class FullNameSortExpression implements ISortExpression {
    build(order: AuthorSortDirection): Prisma.Sql;
}
