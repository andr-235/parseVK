import { CommentsService } from './comments.service.js';
import { CommentsSearchService } from '../comments-search/comments-search.service.js';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto.js';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto.js';
import type { CommentsListDto } from './dto/comments-list.dto.js';
import { UpdateCommentReadDto } from './dto/update-comment-read.dto.js';
import { CommentsQueryValidator } from './validators/comments-query.validator.js';
import type { CommentsSearchRequestDto } from '../comments-search/dto/comments-search-request.dto.js';
import type { CommentsSearchResponseDto } from '../comments-search/dto/comments-search-response.dto.js';
export declare class CommentsController {
    private readonly commentsService;
    private readonly commentsSearchService;
    private readonly queryValidator;
    constructor(commentsService: CommentsService, commentsSearchService: CommentsSearchService, queryValidator: CommentsQueryValidator);
    getComments(offset: number, limit: number, keywordsParam?: string | string[], keywordSourceParam?: string, readStatusParam?: string, search?: string): Promise<CommentsListDto>;
    getCommentsCursor(cursor?: string, limit?: number, keywordsParam?: string | string[], keywordSourceParam?: string, readStatusParam?: string, search?: string): Promise<CommentsCursorListDto>;
    updateReadStatus(id: number, { isRead }: UpdateCommentReadDto): Promise<CommentWithAuthorDto>;
    searchComments(payload: CommentsSearchRequestDto): Promise<CommentsSearchResponseDto>;
}
