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
import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException, BadRequestException, } from '@nestjs/common';
import { ResumeTaskCommand } from '../impl/resume-task.command.js';
import { ParsingQueueService } from '../../../tasks/parsing-queue.service.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
import { TaskContextBuilder } from '../../../tasks/builders/task-context.builder.js';
import { TaskResumedEvent } from '../../../tasks/events/index.js';
let ResumeTaskHandler = class ResumeTaskHandler {
    repository;
    parsingQueue;
    eventBus;
    taskMapper;
    descriptionParser;
    contextBuilder;
    constructor(repository, parsingQueue, eventBus, taskMapper, descriptionParser, contextBuilder) {
        this.repository = repository;
        this.parsingQueue = parsingQueue;
        this.eventBus = eventBus;
        this.taskMapper = taskMapper;
        this.descriptionParser = descriptionParser;
        this.contextBuilder = contextBuilder;
    }
    async execute(command) {
        const task = await this.repository.findUnique({
            id: command.taskId,
        });
        if (!task) {
            throw new NotFoundException(`Задача с id=${command.taskId} не найдена`);
        }
        const taskRecord = task;
        const status = this.taskMapper.parseTaskStatus(taskRecord.status);
        if (status === 'done' || taskRecord.completed === true) {
            throw new BadRequestException('Задача уже завершена');
        }
        const context = await this.contextBuilder.buildResumeContext(taskRecord);
        const updatedTask = await this.repository.update({ id: command.taskId }, {
            status: 'pending',
            completed: false,
            totalItems: context.totalItems,
            processedItems: context.processedItems,
            progress: context.progress,
            description: this.descriptionParser.stringify({
                scope: context.scope,
                mode: context.mode,
                groupIds: context.groupIds,
                postLimit: context.postLimit,
                stats: context.parsed.stats,
                skippedGroupsMessage: context.parsed.skippedGroupsMessage,
                skippedGroupIds: context.parsed.skippedGroupIds,
                current: taskRecord.description,
            }),
        });
        if (!updatedTask) {
            throw new NotFoundException(`Задача с id=${command.taskId} не найдена`);
        }
        await this.parsingQueue.enqueue({
            taskId: task.id,
            scope: context.scope,
            groupIds: context.groupIds,
            postLimit: context.postLimit,
            mode: context.mode,
        });
        this.eventBus.publish(new TaskResumedEvent(command.taskId, new Date()));
        return this.mapTaskToDetail(updatedTask);
    }
    mapTaskToDetail(task) {
        const parsed = this.descriptionParser.parse(task);
        const status = this.taskMapper.parseTaskStatus(task.status) ??
            this.taskMapper.resolveTaskStatus(task, parsed);
        return this.taskMapper.mapToDetail(task, parsed, status);
    }
};
ResumeTaskHandler = __decorate([
    Injectable(),
    CommandHandler(ResumeTaskCommand),
    __param(0, Inject('ITasksRepository')),
    __metadata("design:paramtypes", [Object, ParsingQueueService,
        EventBus,
        TaskMapper,
        TaskDescriptionParser,
        TaskContextBuilder])
], ResumeTaskHandler);
export { ResumeTaskHandler };
//# sourceMappingURL=resume-task.handler.js.map