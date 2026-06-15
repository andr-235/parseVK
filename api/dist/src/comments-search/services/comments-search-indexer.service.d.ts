import { PrismaService } from '../../prisma.service.js';
import type { CommentsSearchClient } from '../comments-search.client.js';
import { CommentsSearchDocumentMapper } from '../mappers/comments-search-document.mapper.js';
import type { CommentsSearchConfig } from '../comments-search.types.js';
export declare class CommentsSearchIndexerService {
    private readonly config;
    private readonly prisma;
    private readonly client;
    private readonly mapper;
    private readonly logger;
    constructor(config: CommentsSearchConfig, prisma: PrismaService, client: Pick<CommentsSearchClient, 'indexDocument'>, mapper: CommentsSearchDocumentMapper);
    indexCommentById(commentId: number): Promise<void>;
    indexCommentsByPost(ownerId: number, postId: number): Promise<void>;
}
