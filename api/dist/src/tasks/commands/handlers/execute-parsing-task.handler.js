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
var ExecuteParsingTaskHandler_1;
import { CommandHandler, EventBus, CommandBus, } from '@nestjs/cqrs';
import { Inject, Injectable, Logger, NotFoundException, Optional, BadRequestException, } from '@nestjs/common';
import { ExecuteParsingTaskCommand } from '../impl/execute-parsing-task.command.js';
import { ProcessGroupCommand } from '../impl/process-group.command.js';
import { UpdateTaskProgressCommand } from '../impl/update-task-progress.command.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
import { TaskCancelledError } from '../../../tasks/errors/task-cancelled.error.js';
import { TaskGroupResolverService } from '../../../tasks/services/task-group-resolver.service.js';
import { MetricsService } from '../../../metrics/metrics.service.js';
import { TaskStartedEvent, TaskCompletedEvent, TaskFailedEvent, } from '../../../tasks/events/index.js';
let ExecuteParsingTaskHandler = ExecuteParsingTaskHandler_1 = class ExecuteParsingTaskHandler {
    repository;
    commandBus;
    eventBus;
    cancellationService;
    groupResolver;
    metricsService;
    logger = new Logger(ExecuteParsingTaskHandler_1.name);
    constructor(repository, commandBus, eventBus, cancellationService, groupResolver, metricsService) {
        this.repository = repository;
        this.commandBus = commandBus;
        this.eventBus = eventBus;
        this.cancellationService = cancellationService;
        this.groupResolver = groupResolver;
        this.metricsService = metricsService;
    }
    async execute(command) {
        const { taskId, scope, groupIds, postLimit, mode } = command;
        this.logger.log(`Запуск парсинга задачи ${taskId}: scope=${scope}, количество групп=${groupIds.length}, лимит постов=${postLimit}, mode=${mode}`);
        this.cancellationService.throwIfCancelled(taskId);
        const task = await this.repository.findTaskById(taskId);
        if (!task) {
            this.logger.warn(`Задача ${taskId} не найдена в базе данных, парсинг пропущен`);
            return;
        }
        const groups = await this.safeResolveGroups(scope, groupIds);
        this.logger.log(`Для задачи ${taskId} определено ${groups.length} групп для обработки`);
        if (!groups.length) {
            await this.failTask(taskId, 'Нет доступных групп для парсинга', undefined, scope, groupIds, postLimit, mode);
            return;
        }
        const storedMetadata = this.extractStoredMetadata(task.description ?? null);
        const context = this.createProcessingContext(groups.length, task.processedItems ?? 0, storedMetadata.stats, storedMetadata.skippedGroupIds);
        if (context.processedGroups > 0) {
            this.logger.log(`Задача ${taskId}: возобновление обработки, уже обработано групп: ${context.processedGroups}/${context.totalGroups}`);
        }
        this.eventBus.publish(new TaskStartedEvent(taskId, new Date()));
        try {
            await this.processGroups({
                groups,
                mode,
                postLimit,
                context,
                taskId,
            });
            await this.completeTask(taskId, context, scope, groupIds, postLimit, mode);
        }
        catch (error) {
            if (error instanceof TaskCancelledError) {
                this.logger.warn(`Задача ${taskId} отменена пользователем`);
                throw error;
            }
            await this.failTask(taskId, error, context, scope, groupIds, postLimit, mode);
            throw error;
        }
        finally {
            this.cancellationService.clear(taskId);
        }
    }
    async processGroups(params) {
        const { groups, mode, postLimit, context, taskId } = params;
        this.cancellationService.throwIfCancelled(taskId);
        const alreadyProcessed = Math.min(Math.max(context.processedGroups, 0), groups.length);
        const remainingGroups = alreadyProcessed > 0 ? groups.slice(alreadyProcessed) : groups;
        if (alreadyProcessed > 0) {
            this.logger.log(`Задача ${taskId}: пропускаем ${alreadyProcessed} обработанных ранее групп, продолжим с индекса ${alreadyProcessed + 1}`);
        }
        if (!remainingGroups.length) {
            this.logger.log(`Задача ${taskId}: все группы уже были обработаны, дополнительная обработка не требуется`);
            return;
        }
        for (const group of remainingGroups) {
            this.cancellationService.throwIfCancelled(taskId);
            const currentGroupNumber = context.processedGroups + 1;
            this.logger.log(`Задача ${taskId}: начинаем обработку группы ${group.vkId} (${currentGroupNumber}/${context.totalGroups})`);
            const shouldUpdateProgress = await this.commandBus.execute(new ProcessGroupCommand(group, mode, postLimit, context, taskId));
            if (shouldUpdateProgress) {
                context.processedGroups += 1;
                const progress = context.totalGroups > 0
                    ? Math.min(1, context.processedGroups / context.totalGroups)
                    : 0;
                await this.commandBus.execute(new UpdateTaskProgressCommand(taskId, context.processedGroups, progress, 'running', context.stats));
            }
        }
    }
    async completeTask(taskId, context, scope, groupIds, postLimit, mode) {
        const skippedGroupsMessage = this.buildSkippedGroupsMessage(context.skippedGroupVkIds);
        const updatedTask = await this.repository.updateTask(taskId, {
            completed: true,
            processedItems: context.totalGroups,
            progress: 1,
            status: 'done',
            description: JSON.stringify({
                scope,
                groupIds,
                mode,
                postLimit,
                stats: context.stats,
                skippedGroupsMessage: skippedGroupsMessage ?? undefined,
                skippedGroupIds: context.skippedGroupVkIds.length
                    ? context.skippedGroupVkIds
                    : undefined,
                failedGroups: context.failedGroups.length > 0 ? context.failedGroups : undefined,
            }),
        });
        if (!updatedTask) {
            throw new NotFoundException(`Задача ${taskId} не найдена`);
        }
        this.metricsService?.recordTask('done');
        this.eventBus.publish(new TaskCompletedEvent(taskId, new Date(), context.stats, context.skippedGroupVkIds));
        const failedGroupsInfo = context.failedGroups.length > 0
            ? `, ошибок в группах: ${context.failedGroups.length}`
            : '';
        this.logger.log(`Задача ${taskId} успешно завершена: группы=${context.stats.groups}, посты=${context.stats.posts}, комментарии=${context.stats.comments}, авторы=${context.stats.authors}${failedGroupsInfo}`);
        if (context.failedGroups.length > 0) {
            context.failedGroups.forEach((failedGroup) => {
                this.logger.warn(`Задача ${taskId}: ошибка в группе ${failedGroup.vkId} (${failedGroup.name}): ${failedGroup.error}`);
            });
        }
    }
    async failTask(taskId, error, context, scope, groupIds, postLimit, mode) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const skippedGroupsMessage = context
            ? this.buildSkippedGroupsMessage(context.skippedGroupVkIds)
            : null;
        const updatedTask = await this.repository.updateTask(taskId, {
            status: 'failed',
            description: JSON.stringify({
                scope,
                groupIds,
                mode,
                postLimit,
                error: errorMessage,
                skippedGroupsMessage: skippedGroupsMessage ?? undefined,
                stats: context?.stats,
                skippedGroupIds: context && context.skippedGroupVkIds.length
                    ? context.skippedGroupVkIds
                    : undefined,
                failedGroups: context && context.failedGroups.length > 0
                    ? context.failedGroups
                    : undefined,
            }),
        });
        if (!updatedTask) {
            throw new NotFoundException(`Задача ${taskId} не найдена`);
        }
        this.eventBus.publish(new TaskFailedEvent(taskId, new Date(), errorMessage, context?.stats));
        this.logger.error(`Задача ${taskId} завершилась с ошибкой: ${errorMessage}`);
    }
    async safeResolveGroups(scope, groupIds) {
        try {
            return await this.groupResolver.resolveGroups(scope, groupIds);
        }
        catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof BadRequestException) {
                return [];
            }
            throw error;
        }
    }
    extractStoredMetadata(description) {
        if (!description) {
            return { stats: null, skippedGroupIds: [] };
        }
        try {
            const parsed = JSON.parse(description);
            if (!parsed || typeof parsed !== 'object') {
                return { stats: null, skippedGroupIds: [] };
            }
            const stats = this.normalizeParsingStats(parsed['stats']);
            const skippedGroupIds = this.normalizeSkippedGroupIds(parsed);
            return {
                stats,
                skippedGroupIds,
            };
        }
        catch {
            return { stats: null, skippedGroupIds: [] };
        }
    }
    normalizeParsingStats(value) {
        if (!value || typeof value !== 'object') {
            return null;
        }
        const record = value;
        const groups = this.toFiniteNumber(record['groups']);
        const posts = this.toFiniteNumber(record['posts']);
        const comments = this.toFiniteNumber(record['comments']);
        const authors = this.toFiniteNumber(record['authors']);
        if (groups == null &&
            posts == null &&
            comments == null &&
            authors == null) {
            return null;
        }
        return {
            groups: groups ?? 0,
            posts: posts ?? 0,
            comments: comments ?? 0,
            authors: authors ?? 0,
        };
    }
    normalizeSkippedGroupIds(data) {
        const skippedRaw = data['skippedGroupIds'];
        const idsFromArray = Array.isArray(skippedRaw)
            ? skippedRaw
                .map((value) => this.parseGroupId(value))
                .filter((value) => value != null)
            : [];
        const message = data['skippedGroupsMessage'];
        const idsFromMessage = typeof message === 'string'
            ? this.extractGroupIdsFromMessage(message)
            : [];
        return Array.from(new Set([...idsFromArray, ...idsFromMessage]));
    }
    extractGroupIdsFromMessage(message) {
        const matches = message.match(/\d+/g);
        if (!matches) {
            return [];
        }
        return matches
            .map((token) => Number.parseInt(token, 10))
            .filter((item) => Number.isFinite(item));
    }
    parseGroupId(value) {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value === 'string') {
            const parsed = Number.parseInt(value, 10);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }
    toFiniteNumber(value) {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }
    createProcessingContext(totalGroups, processedGroups, previousStats, skippedGroupIds) {
        const clampedProcessed = Math.min(Math.max(processedGroups, 0), totalGroups);
        const normalizedSkipped = Array.from(new Set(skippedGroupIds.filter((value) => Number.isFinite(value))));
        const baseGroups = previousStats?.groups ??
            Math.max(totalGroups - normalizedSkipped.length, 0);
        const stats = {
            groups: Math.max(Math.min(baseGroups, totalGroups), 0),
            posts: previousStats?.posts ?? 0,
            comments: previousStats?.comments ?? 0,
            authors: previousStats?.authors ?? 0,
        };
        return {
            totalGroups,
            processedGroups: clampedProcessed,
            stats,
            skippedGroupVkIds: normalizedSkipped,
            processedAuthorIds: new Set(),
            failedGroups: [],
        };
    }
    buildSkippedGroupsMessage(groupVkIds) {
        if (!groupVkIds.length) {
            return null;
        }
        const formattedIds = groupVkIds.map(String).join(', ');
        return `Пропущены группы с отключенной стеной: ${formattedIds}`;
    }
};
ExecuteParsingTaskHandler = ExecuteParsingTaskHandler_1 = __decorate([
    Injectable(),
    CommandHandler(ExecuteParsingTaskCommand),
    __param(0, Inject('IParsingTaskRepository')),
    __param(5, Optional()),
    __metadata("design:paramtypes", [Object, CommandBus,
        EventBus,
        TaskCancellationService,
        TaskGroupResolverService,
        MetricsService])
], ExecuteParsingTaskHandler);
export { ExecuteParsingTaskHandler };
//# sourceMappingURL=execute-parsing-task.handler.js.map