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
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateTaskProgressCommand } from '../impl/update-task-progress.command.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
import { TaskProgressUpdatedEvent } from '../../../tasks/events/index.js';
let UpdateTaskProgressHandler = class UpdateTaskProgressHandler {
    repository;
    eventBus;
    cancellationService;
    constructor(repository, eventBus, cancellationService) {
        this.repository = repository;
        this.eventBus = eventBus;
        this.cancellationService = cancellationService;
    }
    async execute(command) {
        const { taskId, processedItems, progress, status, stats } = command;
        this.cancellationService.throwIfCancelled(taskId);
        const updatedTask = await this.repository.updateTask(taskId, {
            processedItems,
            progress,
            status,
        });
        if (!updatedTask) {
            throw new NotFoundException(`Задача ${taskId} не найдена`);
        }
        this.eventBus.publish(new TaskProgressUpdatedEvent(taskId, processedItems, progress, stats));
    }
};
UpdateTaskProgressHandler = __decorate([
    Injectable(),
    CommandHandler(UpdateTaskProgressCommand),
    __param(0, Inject('IParsingTaskRepository')),
    __metadata("design:paramtypes", [Object, EventBus,
        TaskCancellationService])
], UpdateTaskProgressHandler);
export { UpdateTaskProgressHandler };
//# sourceMappingURL=update-task-progress.handler.js.map