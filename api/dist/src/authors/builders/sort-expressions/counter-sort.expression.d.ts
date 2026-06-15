import type { AuthorSortDirection } from '../../types/authors.types.js';
import type { ISortExpression } from './sort-expression.interface.js';
export declare class CounterSortExpression implements ISortExpression {
    private readonly keys;
    constructor(keys: string[]);
    build(order: AuthorSortDirection): import("@prisma/client-runtime-utils").Sql;
}
