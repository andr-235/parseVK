import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthorSortDirection } from '../../types/authors.types.js';
import type { ISortExpression } from './sort-expression.interface.js';
type AuthorColumn = 'verifiedAt' | 'updatedAt';
export declare class SimpleSortExpression implements ISortExpression {
    private readonly column;
    private readonly nullsLast;
    constructor(column: AuthorColumn, nullsLast?: boolean);
    build(order: AuthorSortDirection): Prisma.Sql;
}
export {};
