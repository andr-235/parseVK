import type { Prisma } from '../../generated/prisma/client.js';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface.js';
export type CommentAuthor = NonNullable<CommentWithRelations['author']>;
export type PostWithGroup = CommentWithRelations['post'];
export type PostGroup = NonNullable<PostWithGroup['group']>;
export type KeywordInMatch = {
    id: number;
    word: string;
    category: string | null;
    isPhrase: boolean;
    keywordForms: Array<{
        form: string;
    }>;
};
export type CommentKeywordMatch = {
    keyword: KeywordInMatch;
    source: string;
};
export type CommentKeywordMatches = Array<CommentKeywordMatch>;
export type CommentWhereInput = Prisma.CommentWhereInput;
export type CommentOrderByInput = Prisma.CommentOrderByWithRelationInput;
