import { AuthorsSaverService } from './authors-saver.service.js';
import { CommentsSaverService } from './comments-saver.service.js';
import type { CommentEntity } from '../types/comment-entity.type.js';
import type { KeywordMatchCandidate } from '../utils/keyword-normalization.utils.js';
import type { CommentSource } from '../types/comment-source.enum.js';
export declare class AuthorActivityService {
    private readonly authorsSaver;
    private readonly commentsSaver;
    constructor(authorsSaver: AuthorsSaverService, commentsSaver: CommentsSaverService);
    refreshAllAuthors(batchSize?: number): Promise<number>;
    saveAuthors(userIds: number[]): Promise<number>;
    saveComments(comments: CommentEntity[], options: {
        source: CommentSource;
        watchlistAuthorId?: number | null;
        keywordMatches?: KeywordMatchCandidate[];
    }): Promise<number>;
}
