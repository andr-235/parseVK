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
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GetTaskByIdQuery } from '../impl/get-task-by-id.query.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
let GetTaskByIdHandler = class GetTaskByIdHandler {
    repository;
    taskMapper;
    descriptionParser;
    constructor(repository, taskMapper, descriptionParser) {
        this.repository = repository;
        this.taskMapper = taskMapper;
        this.descriptionParser = descriptionParser;
    }
    async execute(query) {
        const task = await this.repository.findUnique({
            id: query.taskId,
        });
        if (!task) {
            throw new NotFoundException(`Задача с id=${query.taskId} не найдена`);
        }
        return this.mapTaskToDetail(task);
    }
    mapTaskToDetail(task) {
        const parsed = this.descriptionParser.parse(task);
        const status = this.taskMapper.parseTaskStatus(task.status) ??
            this.taskMapper.resolveTaskStatus(task, parsed);
        return this.taskMapper.mapToDetail(task, parsed, status);
    }
};
GetTaskByIdHandler = __decorate([
    Injectable(),
    QueryHandler(GetTaskByIdQuery),
    __param(0, Inject('ITasksRepository')),
    __metadata("design:paramtypes", [Object, TaskMapper,
        TaskDescriptionParser])
], GetTaskByIdHandler);
export { GetTaskByIdHandler };
//# sourceMappingURL=get-task-by-id.handler.js.map