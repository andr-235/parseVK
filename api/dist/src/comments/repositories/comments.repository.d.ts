import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma.service.js';
import type { CommentWithRelations, CountCommentsParams, FindCommentsParams, ICommentsRepository, UpdateCommentParams } from '../interfaces/comments-repository.interface.js';
export declare class CommentsRepository implements ICommentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: FindCommentsParams): Promise<CommentWithRelations[]>;
    count(params: CountCommentsParams): Promise<number>;
    update(params: UpdateCommentParams): Promise<CommentWithRelations>;
    transaction<T>(queries: Prisma.PrismaPromise<T>[]): Promise<T[]>;
}
