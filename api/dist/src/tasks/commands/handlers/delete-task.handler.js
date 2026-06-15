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
var DeleteTaskHandler_1;
import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DeleteTaskCommand } from '../impl/delete-task.command.js';
import { ParsingQueueService } from '../../../tasks/parsing-queue.service.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
import { TaskDeletedEvent } from '../../../tasks/events/index.js';
let DeleteTaskHandler = DeleteTaskHandler_1 = class DeleteTaskHandler {
    repository;
    parsingQueue;
    cancellationService;
    eventBus;
    logger = new Logger(DeleteTaskHandler_1.name);
    constructor(repository, parsingQueue, cancellationService, eventBus) {
        this.repository = repository;
        this.parsingQueue = parsingQueue;
        this.cancellationService = cancellationService;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const existing = await this.repository.findUnique({ id: command.taskId });
        if (!existing) {
            throw new NotFoundException(`Задача с id=${command.taskId} не найдена`);
        }
        this.cancellationService.requestCancel(command.taskId);
        let shouldClearCancellation = true;
        try {
            await this.parsingQueue.remove(command.taskId);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message.includes('locked by another worker')) {
                shouldClearCancellation = false;
                this.logger.warn(`Не удалось удалить задачу ${command.taskId} из очереди: ${error.message}. Работающее задание будет остановлено`);
            }
            else {
                this.cancellationService.clear(command.taskId);
                throw error;
            }
        }
        await this.repository.delete({ id: command.taskId });
        if (shouldClearCancellation) {
            this.cancellationService.clear(command.taskId);
        }
        this.eventBus.publish(new TaskDeletedEvent(command.taskId, new Date()));
    }
};
DeleteTaskHandler = DeleteTaskHandler_1 = __decorate([
    Injectable(),
    CommandHandler(DeleteTaskCommand),
    __param(0, Inject('ITasksRepository')),
    __metadata("design:paramtypes", [Object, ParsingQueueService,
        TaskCancellationService,
        EventBus])
], DeleteTaskHandler);
export { DeleteTaskHandler };
//# sourceMappingURL=delete-task.handler.js.map