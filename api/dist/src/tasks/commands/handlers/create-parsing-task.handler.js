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
import { Inject, Injectable, NotFoundException, Optional, } from '@nestjs/common';
import { CreateParsingTaskCommand } from '../impl/create-parsing-task.command.js';
import { TaskGroupResolverService } from '../../../tasks/services/task-group-resolver.service.js';
import { ParsingQueueService } from '../../../tasks/parsing-queue.service.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
import { ParsingScope, ParsingTaskMode, } from '../../../tasks/dto/create-parsing-task.dto.js';
import { TaskCreatedEvent } from '../../../tasks/events/index.js';
import { MetricsService } from '../../../metrics/metrics.service.js';
let CreateParsingTaskHandler = class CreateParsingTaskHandler {
    repository;
    groupResolver;
    parsingQueue;
    eventBus;
    taskMapper;
    descriptionParser;
    metricsService;
    constructor(repository, groupResolver, parsingQueue, eventBus, taskMapper, descriptionParser, metricsService) {
        this.repository = repository;
        this.groupResolver = groupResolver;
        this.parsingQueue = parsingQueue;
        this.eventBus = eventBus;
        this.taskMapper = taskMapper;
        this.descriptionParser = descriptionParser;
        this.metricsService = metricsService;
    }
    async execute(command) {
        const scope = command.scope ??
            (command.groupIds?.length ? ParsingScope.SELECTED : ParsingScope.ALL);
        const mode = command.mode ?? ParsingTaskMode.RECENT_POSTS;
        const postLimit = mode === ParsingTaskMode.RECHECK_GROUP ? null : (command.postLimit ?? 10);
        const groupIds = command.groupIds ?? [];
        const groups = await this.groupResolver.resolveGroups(scope, groupIds);
        if (!groups.length) {
            throw new NotFoundException('Нет доступных групп для парсинга');
        }
        const totalItems = groups.length;
        const task = await this.repository.create({
            title: this.groupResolver.buildTaskTitle(scope, groups, mode),
            description: JSON.stringify({ scope, groupIds, mode, postLimit }),
            totalItems,
            processedItems: 0,
            progress: 0,
            status: 'pending',
        });
        this.metricsService?.recordTask('pending');
        await this.parsingQueue.enqueue({
            taskId: task.id,
            scope,
            groupIds,
            postLimit,
            mode,
        });
        this.eventBus.publish(new TaskCreatedEvent(task.id, scope, groupIds, postLimit, mode, task.createdAt));
        return this.mapTaskToDetail(task);
    }
    mapTaskToDetail(task) {
        const parsed = this.descriptionParser.parse(task);
        const status = this.taskMapper.parseTaskStatus(task.status) ??
            this.taskMapper.resolveTaskStatus(task, parsed);
        return this.taskMapper.mapToDetail(task, parsed, status);
    }
};
CreateParsingTaskHandler = __decorate([
    Injectable(),
    CommandHandler(CreateParsingTaskCommand),
    __param(0, Inject('ITasksRepository')),
    __param(6, Optional()),
    __metadata("design:paramtypes", [Object, TaskGroupResolverService,
        ParsingQueueService,
        EventBus,
        TaskMapper,
        TaskDescriptionParser,
        MetricsService])
], CreateParsingTaskHandler);
export { CreateParsingTaskHandler };
//# sourceMappingURL=create-parsing-task.handler.js.map