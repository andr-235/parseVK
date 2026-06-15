var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let TaskMapper = class TaskMapper {
    mapToDetail(task, parsed, status) {
        return {
            ...this.mapToSummary(task, parsed, status),
            description: task.description ?? null,
        };
    }
    mapToSummary(task, parsed, status) {
        const totalItems = task.totalItems ?? 0;
        const processedItems = task.processedItems ?? 0;
        const completed = task.completed ?? false;
        const progress = task.progress ?? (completed ? 1 : 0);
        return {
            id: task.id,
            title: task.title,
            status,
            completed,
            totalItems,
            processedItems,
            progress,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            scope: parsed.scope,
            mode: parsed.mode,
            groupIds: parsed.groupIds,
            postLimit: parsed.postLimit,
            stats: parsed.stats,
            error: parsed.error,
            skippedGroupsMessage: parsed.skippedGroupsMessage,
        };
    }
    parseTaskStatus(value) {
        if (typeof value !== 'string') {
            return null;
        }
        const allowed = ['pending', 'running', 'done', 'failed'];
        return allowed.includes(value) ? value : null;
    }
    resolveTaskStatus(task, parsed) {
        if (task.completed === true) {
            return 'done';
        }
        if (parsed.error) {
            return 'failed';
        }
        if ((task.processedItems ?? 0) > 0) {
            return 'running';
        }
        return 'pending';
    }
};
TaskMapper = __decorate([
    Injectable()
], TaskMapper);
export { TaskMapper };
//# sourceMappingURL=task.mapper.js.map