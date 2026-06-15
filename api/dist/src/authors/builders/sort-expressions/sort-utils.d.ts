import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthorSortDirection } from '../../types/authors.types.js';
export declare class SortUtils {
    static applyDirection(expression: Prisma.Sql, order: AuthorSortDirection, options?: {
        nullsLast?: boolean;
    }): Prisma.Sql;
    static buildCounterValueExpression(keys: string[]): Prisma.Sql;
    private static buildCounterValueExpressionForKey;
    static buildUnixMillisExpression(value: Prisma.Sql): Prisma.Sql;
}
