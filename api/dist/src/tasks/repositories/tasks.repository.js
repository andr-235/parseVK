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
let TasksRepository = class TasksRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(data) {
        return this.prisma.task.create({ data });
    }
    findMany(params) {
        return this.prisma.task.findMany({
            skip: params?.skip,
            take: params?.take,
            where: params?.where,
            orderBy: params?.orderBy,
        });
    }
    count() {
        return this.prisma.task.count();
    }
    findUnique(where) {
        return this.prisma.task.findUnique({ where });
    }
    update(where, data) {
        return this.prisma.task.update({ where, data }).catch((error) => {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                return null;
            }
            throw error;
        });
    }
    async delete(where) {
        await this.prisma.task.delete({ where });
    }
};
TasksRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], TasksRepository);
export { TasksRepository };
//# sourceMappingURL=tasks.repository.js.map