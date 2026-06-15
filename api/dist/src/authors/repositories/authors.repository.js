var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma.service.js';
import { AuthorSortBuilder } from '../builders/author-sort.builder.js';
let AuthorsRepository = class AuthorsRepository {
    prisma;
    sortBuilder = new AuthorSortBuilder();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async countByFilters(sqlConditions) {
        const whereClause = this.buildWhereClause(sqlConditions);
        const query = Prisma.sql `
      SELECT COUNT(*)::int
      FROM "Author"
      ${whereClause}
    `;
        const result = await this.queryRaw(query);
        return result[0]?.count ?? 0;
    }
    async findByFilters(params) {
        const whereClause = this.buildWhereClause(params.sqlConditions);
        const orderClause = this.sortBuilder.buildOrderClause(params.sort);
        const query = Prisma.sql `
      SELECT *
      FROM "Author"
      ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${params.offset}
      LIMIT ${params.limit}
    `;
        return this.queryRaw(query);
    }
    findUnique(where) {
        return this.prisma.author.findUnique({ where });
    }
    async deleteAuthorAndComments(vkUserId) {
        await this.prisma.$transaction(async (tx) => {
            const watchlistAuthors = await tx.watchlistAuthor.findMany({
                where: { authorVkId: vkUserId },
                select: { id: true },
            });
            const watchlistIds = watchlistAuthors.map((item) => item.id);
            const commentConditions = [
                { authorVkId: vkUserId },
            ];
            if (watchlistIds.length > 0) {
                commentConditions.push({ watchlistAuthorId: { in: watchlistIds } });
            }
            await tx.comment.deleteMany({
                where: { OR: commentConditions },
            });
            await tx.author.delete({
                where: { vkUserId },
            });
        });
    }
    async markAuthorVerified(vkUserId, verifiedAt) {
        const updated = await this.prisma.author.update({
            where: { vkUserId },
            data: { verifiedAt },
            select: { verifiedAt: true },
        });
        return updated.verifiedAt ?? verifiedAt;
    }
    queryRaw(query) {
        return this.prisma.$queryRaw(query);
    }
    buildWhereClause(sqlConditions) {
        const conditions = sqlConditions;
        return conditions.length > 0
            ? Prisma.sql `WHERE ${Prisma.join(conditions, ' AND ')}`
            : Prisma.sql ``;
    }
};
AuthorsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], AuthorsRepository);
export { AuthorsRepository };
//# sourceMappingURL=authors.repository.js.map