var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetTaskStatisticsQuery } from '../impl/get-task-statistics.query.js';
let GetTaskStatisticsHandler = class GetTaskStatisticsHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(query) {
        const filters = query.filters;
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.dateFrom || filters?.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) {
                where.createdAt.gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                where.createdAt.lte = filters.dateTo;
            }
        }
        const allTasks = await this.repository.findMany({ where });
        const total = allTasks.length;
        const pending = allTasks.filter((task) => task.status === 'pending').length;
        const running = allTasks.filter((task) => task.status === 'running').length;
        const completed = allTasks.filter((task) => task.completed === true || task.status === 'done').length;
        const failed = allTasks.filter((task) => task.status === 'failed').length;
        return {
            total,
            pending,
            running,
            completed,
            failed,
        };
    }
};
GetTaskStatisticsHandler = __decorate([
    Injectable(),
    QueryHandler(GetTaskStatisticsQuery),
    __param(0, Inject('ITasksRepository')),
    __metadata("design:paramtypes", [Object])
], GetTaskStatisticsHandler);
export { GetTaskStatisticsHandler };
//# sourceMappingURL=get-task-statistics.handler.js.map