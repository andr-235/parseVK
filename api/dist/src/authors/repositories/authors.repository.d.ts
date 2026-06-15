import { PrismaService } from '../../prisma.service.js';
import type { IAuthorsRepository } from '../interfaces/authors-repository.interface.js';
import type { AuthorRecord } from '../types/author-record.type.js';
import type { ResolvedAuthorSort, SqlFragment } from '../types/authors.types.js';
export declare class AuthorsRepository implements IAuthorsRepository {
    private readonly prisma;
    private readonly sortBuilder;
    constructor(prisma: PrismaService);
    countByFilters(sqlConditions: SqlFragment[]): Promise<number>;
    findByFilters(params: {
        sqlConditions: SqlFragment[];
        offset: number;
        limit: number;
        sort: ResolvedAuthorSort;
    }): Promise<AuthorRecord[]>;
    findUnique(where: {
        vkUserId: number;
    }): Promise<AuthorRecord | null>;
    deleteAuthorAndComments(vkUserId: number): Promise<void>;
    markAuthorVerified(vkUserId: number, verifiedAt: Date): Promise<Date>;
    private queryRaw;
    private buildWhereClause;
}
