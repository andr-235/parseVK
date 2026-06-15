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
let GroupsRepository = class GroupsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    upsert(where, data) {
        return this.prisma.group.upsert({
            where,
            update: data,
            create: data,
        });
    }
    findMany(params) {
        return this.prisma.group.findMany({
            skip: params.skip,
            take: params.take,
            orderBy: params.orderBy,
        });
    }
    count() {
        return this.prisma.group.count();
    }
    async getGroupsWithCount(params) {
        return this.prisma.$transaction(async (tx) => {
            const items = await tx.group.findMany({
                orderBy: { updatedAt: 'desc' },
                skip: params.skip,
                take: params.take,
            });
            const total = await tx.group.count();
            return { items, total };
        });
    }
    delete(where) {
        return this.prisma.group.delete({ where });
    }
    deleteMany() {
        return this.prisma.group.deleteMany({});
    }
    findManyByVkIds(vkIds) {
        return this.prisma.group.findMany({
            where: {
                vkId: {
                    in: vkIds,
                },
            },
        });
    }
};
GroupsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], GroupsRepository);
export { GroupsRepository };
//# sourceMappingURL=groups.repository.js.map