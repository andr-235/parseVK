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
import { PrismaService } from '../../prisma.service.js';
let ListingsRepository = class ListingsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findMany(params) {
        return this.prisma.listing.findMany({
            where: params.where,
            skip: params.skip,
            take: params.take,
            orderBy: params.orderBy,
            cursor: params.cursor,
        });
    }
    count(where) {
        return this.prisma.listing.count({
            where: where,
        });
    }
    findUniqueOrThrow(where) {
        return this.prisma.listing.findUniqueOrThrow({ where });
    }
    findUniqueByUrl(where) {
        return this.prisma.listing.findUnique({ where });
    }
    upsert(where, create, update) {
        return this.prisma.listing.upsert({
            where,
            update: (update ?? create),
            create: create,
        });
    }
    update(where, data) {
        return this.prisma.listing.update({
            where,
            data: data,
        });
    }
    delete(where) {
        return this.prisma.listing.delete({ where });
    }
    async getListingsWithCountAndSources(params) {
        const orderBy = params.orderBy ?? { createdAt: 'desc' };
        return this.prisma.$transaction(async (tx) => {
            const listings = await tx.listing.findMany({
                where: params.where,
                skip: params.skip,
                take: params.take,
                orderBy: orderBy,
            });
            const total = await tx.listing.count({
                where: params.where,
            });
            const distinctSources = await tx.listing.findMany({
                where: { source: { not: null, notIn: [''] } },
                distinct: ['source'],
                select: { source: true },
                orderBy: { source: 'asc' },
            });
            return { listings, total, distinctSources };
        });
    }
    transaction(callback) {
        return this.prisma.$transaction(async (tx) => callback(tx));
    }
};
ListingsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ListingsRepository);
export { ListingsRepository };
//# sourceMappingURL=listings.repository.js.map