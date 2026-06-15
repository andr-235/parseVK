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
var ParsingProcessor_1;
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Logger, Optional } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Job } from 'bullmq';
import { TasksGateway } from '../tasks.gateway.js';
import { PARSING_QUEUE, PARSING_CONCURRENCY, resolveParsingJobTimeout, } from './parsing.constants.js';
import { TaskCancellationService } from '../task-cancellation.service.js';
import { TaskCancelledError } from '../errors/task-cancelled.error.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import { ExecuteParsingTaskCommand } from '../commands/index.js';
let ParsingProcessor = ParsingProcessor_1 = class ParsingProcessor extends WorkerHost {
    commandBus;
    repository;
    tasksGateway;
    cancellationService;
    metricsService;
    logger = new Logger(ParsingProcessor_1.name);
    constructor(commandBus, repository, tasksGateway, cancellationService, metricsService) {
        super();
        this.commandBus = commandBus;
        this.repository = repository;
        this.tasksGateway = tasksGateway;
        this.cancellationService = cancellationService;
        this.metricsService = metricsService;
    }
    async process(job) {
        const { taskId, scope, groupIds, postLimit, mode } = job.data;
        this.logger.log(`Начало обработки задачи ${taskId} (scope: ${scope}, groups: ${groupIds.length}, postLimit: ${postLimit}, mode: ${mode})`);
        let timeoutHandle = null;
        const jobTimeoutMs = resolveParsingJobTimeout({
            mode,
            groupsCount: groupIds.length,
        });
        try {
            await this.markStatus(taskId, 'running');
            const commandPromise = this.commandBus.execute(new ExecuteParsingTaskCommand(taskId, scope, groupIds, postLimit, mode));
            const timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    this.cancellationService.requestCancel(taskId);
                    void commandPromise.catch(() => undefined);
                    reject(new Error(`Задача ${taskId} превысила лимит времени выполнения (${jobTimeoutMs}мс)`));
                }, jobTimeoutMs);
                if (timeoutHandle && typeof timeoutHandle.unref === 'function') {
                    timeoutHandle.unref();
                }
            });
            await Promise.race([commandPromise, timeoutPromise]);
            this.logger.log(`Задача ${taskId} успешно завершена`);
        }
        catch (error) {
            if (error instanceof TaskCancelledError) {
                this.logger.warn(`Задача ${taskId} была отменена пользователем`);
                return;
            }
            await this.markStatus(taskId, 'failed');
            this.logger.error(`Ошибка при обработке задачи ${taskId}: ${error instanceof Error ? error.message : error}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
        finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            this.cancellationService.clear(taskId);
        }
    }
    onActive(job) {
        this.logger.debug(`Job ${job.id} is now active. TaskId: ${job.data.taskId}`);
    }
    onCompleted(job) {
        this.logger.log(`Job ${job.id} completed. TaskId: ${job.data.taskId}`);
        this.cancellationService.clear(job.data.taskId);
    }
    onFailed(job, error) {
        if (job) {
            this.logger.error(`Job ${job.id} failed. TaskId: ${job.data.taskId}. Error: ${error.message}`);
            this.cancellationService.clear(job.data.taskId);
        }
        else {
            this.logger.error(`Job failed without job data. Error: ${error.message}`);
        }
    }
    onError(error) {
        this.logger.error(`Worker error: ${error.message}`, error.stack);
    }
    async markStatus(taskId, status) {
        try {
            const updatedTask = await this.repository.updateTaskStatus(taskId, status);
            if (!updatedTask) {
                this.logger.warn(`Не удалось обновить статус задачи ${taskId} на ${status}: задача не найдена`);
                return;
            }
            const payload = {
                id: taskId,
                status,
                completed: status === 'failed' ? false : (updatedTask.completed ?? false),
                totalItems: updatedTask.totalItems ?? null,
                processedItems: updatedTask.processedItems ?? null,
                description: updatedTask.description ?? null,
            };
            this.tasksGateway.broadcastStatus(payload);
            this.tasksGateway.broadcastProgress(payload);
            this.metricsService?.recordTask(status);
        }
        catch (error) {
            this.logger.warn(`Не удалось обновить статус задачи ${taskId} на ${status}: ${error instanceof Error ? error.message : error}`);
        }
    }
};
__decorate([
    OnWorkerEvent('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Job]),
    __metadata("design:returntype", void 0)
], ParsingProcessor.prototype, "onActive", null);
__decorate([
    OnWorkerEvent('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Job]),
    __metadata("design:returntype", void 0)
], ParsingProcessor.prototype, "onCompleted", null);
__decorate([
    OnWorkerEvent('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Error]),
    __metadata("design:returntype", void 0)
], ParsingProcessor.prototype, "onFailed", null);
__decorate([
    OnWorkerEvent('error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Error]),
    __metadata("design:returntype", void 0)
], ParsingProcessor.prototype, "onError", null);
ParsingProcessor = ParsingProcessor_1 = __decorate([
    Processor(PARSING_QUEUE, {
        concurrency: PARSING_CONCURRENCY,
    }),
    __param(1, Inject('IParsingTaskRepository')),
    __param(4, Optional()),
    __metadata("design:paramtypes", [CommandBus, Object, TasksGateway,
        TaskCancellationService,
        MetricsService])
], ParsingProcessor);
export { ParsingProcessor };
//# sourceMappingURL=parsing.processor.js.map