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
import { ParsingScope } from '../dto/create-parsing-task.dto.js';
import { toCreateJsonValue, toUpdateJsonValue, } from '../../common/utils/prisma-json.utils.js';
let ParsingTaskRepository = class ParsingTaskRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findTaskById(taskId) {
        return this.prisma.task.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                description: true,
                totalItems: true,
                processedItems: true,
                progress: true,
                completed: true,
            },
        });
    }
    async updateTask(taskId, data) {
        try {
            return await this.prisma.task.update({
                where: { id: taskId },
                data,
                select: {
                    id: true,
                    description: true,
                    totalItems: true,
                    processedItems: true,
                    progress: true,
                    completed: true,
                },
            });
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }
    updateTaskStatus(taskId, status) {
        return this.updateTask(taskId, { status });
    }
    async findGroups(scope, groupIds) {
        if (scope === ParsingScope.ALL) {
            return this.prisma.group.findMany({
                orderBy: { updatedAt: 'desc' },
                select: { id: true, vkId: true, name: true, wall: true },
            });
        }
        if (!groupIds.length) {
            return [];
        }
        return this.prisma.group.findMany({
            where: { id: { in: groupIds } },
            select: { id: true, vkId: true, name: true, wall: true },
        });
    }
    async updateGroupWall(groupId, wall) {
        await this.prisma.group.update({
            where: { id: groupId },
            data: { wall },
        });
    }
    async upsertPost(data) {
        const attachmentsUpdate = data.attachments !== undefined
            ? toUpdateJsonValue(data.attachments)
            : undefined;
        const attachmentsCreate = data.attachments !== undefined
            ? toCreateJsonValue(data.attachments)
            : undefined;
        const baseData = {
            groupId: data.groupId,
            fromId: data.fromId,
            postedAt: data.postedAt,
            text: data.text,
            commentsCount: data.commentsCount,
            commentsCanPost: data.commentsCanPost,
            commentsGroupsCanPost: data.commentsGroupsCanPost,
            commentsCanClose: data.commentsCanClose,
            commentsCanOpen: data.commentsCanOpen,
        };
        const updateData = {
            ...baseData,
            ...(attachmentsUpdate !== undefined && {
                attachments: attachmentsUpdate,
            }),
        };
        const createData = {
            ownerId: data.ownerId,
            vkPostId: data.vkPostId,
            ...baseData,
            ...(attachmentsCreate !== undefined && {
                attachments: attachmentsCreate,
            }),
        };
        await this.prisma.post.upsert({
            where: {
                ownerId_vkPostId: {
                    ownerId: data.ownerId,
                    vkPostId: data.vkPostId,
                },
            },
            update: updateData,
            create: createData,
        });
    }
};
ParsingTaskRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ParsingTaskRepository);
export { ParsingTaskRepository };
//# sourceMappingURL=parsing-task.repository.js.map