import { type Prisma } from '../../generated/prisma/client.js';
import type { CommentsFilters, ReadStatusFilter } from '../types/comments-filters.type.js';
export declare class CommentsFilterBuilder {
    buildBaseWhere({ keywords, keywordSource, search, }: CommentsFilters): Prisma.CommentWhereInput;
    buildReadStatusWhere(readStatus?: ReadStatusFilter): Prisma.CommentWhereInput;
    mergeWhere(...wheres: Array<Prisma.CommentWhereInput | undefined>): Prisma.CommentWhereInput;
    buildWhere(filters: CommentsFilters): Prisma.CommentWhereInput;
}
