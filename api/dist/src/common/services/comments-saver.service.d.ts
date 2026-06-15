import { CommentSource } from '../types/comment-source.enum.js';
import { PrismaService } from '../../prisma.service.js';
import type { CommentEntity } from '../types/comment-entity.type.js';
import { CommentsSearchIndexerService } from '../../comments-search/services/comments-search-indexer.service.js';
import { type KeywordMatchCandidate } from '../utils/keyword-normalization.utils.js';
export interface SaveCommentsOptions {
    source: CommentSource;
    watchlistAuthorId?: number | null;
    keywordMatches?: KeywordMatchCandidate[];
}
export declare class CommentsSaverService {
    private readonly prisma;
    private readonly searchIndexer?;
    private readonly logger;
    constructor(prisma: PrismaService, searchIndexer?: CommentsSearchIndexerService | undefined);
    saveComments(comments: CommentEntity[], options: SaveCommentsOptions): Promise<number>;
    private saveComment;
    private buildCommentJsonFields;
    private buildCommentBaseFields;
    private buildCommentUpdateData;
    private buildCommentCreateData;
    private serializeComment;
    private loadKeywordMatchCandidates;
    private syncCommentKeywordMatches;
    private deleteCommentKeywordMatches;
    private findMatchedKeywordIdsInText;
    private calculateKeywordMatchDiff;
    private applyKeywordMatchChanges;
    private syncPostKeywordMatches;
    private deleteAllPostKeywordMatches;
    private calculatePostKeywordMatchDiff;
    private applyPostKeywordMatchChanges;
}
