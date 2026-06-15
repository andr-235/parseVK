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
import { GetTasksQuery } from '../impl/get-tasks.query.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
let GetTasksHandler = class GetTasksHandler {
    repository;
    taskMapper;
    descriptionParser;
    constructor(repository, taskMapper, descriptionParser) {
        this.repository = repository;
        this.taskMapper = taskMapper;
        this.descriptionParser = descriptionParser;
    }
    async execute(query) {
        const page = Math.max(query.page ?? 1, 1);
        const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
        const skip = (page - 1) * limit;
        const [tasks, total] = await Promise.all([
            this.repository.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.repository.count(),
        ]);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
        const hasMore = page < totalPages;
        return {
            tasks: tasks.map((task) => this.mapTaskToSummary(task)),
            total,
            page,
            limit,
            totalPages,
            hasMore,
        };
    }
    mapTaskToSummary(task) {
        const parsed = this.descriptionParser.parse(task);
        const status = this.taskMapper.parseTaskStatus(task.status) ??
            this.taskMapper.resolveTaskStatus(task, parsed);
        return this.taskMapper.mapToSummary(task, parsed, status);
    }
};
GetTasksHandler = __decorate([
    Injectable(),
    QueryHandler(GetTasksQuery),
    __param(0, Inject('ITasksRepository')),
    __metadata("design:paramtypes", [Object, TaskMapper,
        TaskDescriptionParser])
], GetTasksHandler);
export { GetTasksHandler };
//# sourceMappingURL=get-tasks.handler.js.map