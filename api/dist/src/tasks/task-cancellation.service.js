var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { TaskCancelledError } from './errors/task-cancelled.error.js';
let TaskCancellationService = class TaskCancellationService {
    cancelledTasks = new Set();
    requestCancel(taskId) {
        this.cancelledTasks.add(taskId);
    }
    clear(taskId) {
        this.cancelledTasks.delete(taskId);
    }
    isCancelled(taskId) {
        return this.cancelledTasks.has(taskId);
    }
    throwIfCancelled(taskId) {
        if (this.isCancelled(taskId)) {
            throw new TaskCancelledError(taskId);
        }
    }
};
TaskCancellationService = __decorate([
    Injectable()
], TaskCancellationService);
export { TaskCancellationService };
//# sourceMappingURL=task-cancellation.service.js.map