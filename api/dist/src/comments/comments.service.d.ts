import { CommentMapper } from './mappers/comment.mapper.js';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy.js';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy.js';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto.js';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto.js';
import type { CommentsListDto } from './dto/comments-list.dto.js';
import type { CommentsCursorOptions, CommentsQueryOptions } from './types/comments-filters.type.js';
import { type ICommentsRepository } from './interfaces/comments-repository.interface.js';
export declare class CommentsService {
    private readonly repository;
    private readonly offsetStrategy;
    private readonly cursorStrategy;
    private readonly mapper;
    constructor(repository: ICommentsRepository, offsetStrategy: OffsetPaginationStrategy, cursorStrategy: CursorPaginationStrategy, mapper: CommentMapper);
    getComments(options: CommentsQueryOptions): Promise<CommentsListDto>;
    getCommentsCursor(options: CommentsCursorOptions): Promise<CommentsCursorListDto>;
    setReadStatus(id: number, isRead: boolean): Promise<CommentWithAuthorDto>;
}
