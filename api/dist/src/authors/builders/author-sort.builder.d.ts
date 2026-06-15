import type { ResolvedAuthorSort, SqlFragment } from '../types/authors.types.js';
export declare class AuthorSortBuilder {
    private static readonly TIE_BREAKERS;
    private static readonly expressions;
    buildOrderClause(sort: ResolvedAuthorSort): SqlFragment;
    private buildPrimarySortExpression;
}
