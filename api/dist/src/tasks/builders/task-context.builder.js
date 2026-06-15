var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException, NotFoundException, } from '@nestjs/common';
import { ParsingScope, ParsingTaskMode, } from '../dto/create-parsing-task.dto.js';
import { TaskGroupResolverService } from '../services/task-group-resolver.service.js';
import { TaskDescriptionParser } from '../parsers/task-description.parser.js';
let TaskContextBuilder = class TaskContextBuilder {
    groupResolver;
    parser;
    constructor(groupResolver, parser) {
        this.groupResolver = groupResolver;
        this.parser = parser;
    }
    async buildResumeContext(task) {
        const parsed = this.parser.parse(task);
        const scope = parsed.scope ??
            (parsed.groupIds.length ? ParsingScope.SELECTED : ParsingScope.ALL);
        const groupIds = scope === ParsingScope.ALL ? [] : Array.from(new Set(parsed.groupIds));
        if (scope === ParsingScope.SELECTED && groupIds.length === 0) {
            throw new BadRequestException('Не удалось определить группы для продолжения задачи');
        }
        const mode = parsed.mode ?? ParsingTaskMode.RECENT_POSTS;
        const postLimit = mode === ParsingTaskMode.RECHECK_GROUP
            ? null
            : this.normalizePostLimit(parsed.postLimit);
        const groups = await this.groupResolver.resolveGroups(scope, groupIds);
        if (!groups.length) {
            throw new NotFoundException('Нет доступных групп для парсинга');
        }
        const totalItems = groups.length;
        const processedItems = Math.min(task.processedItems ?? 0, totalItems);
        const progress = totalItems > 0 ? Math.min(1, processedItems / totalItems) : 0;
        return {
            scope,
            groupIds,
            mode,
            postLimit,
            parsed,
            totalItems,
            processedItems,
            progress,
        };
    }
    normalizePostLimit(value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 10;
        }
        const normalized = Math.trunc(value);
        return Math.max(1, Math.min(normalized, 100));
    }
};
TaskContextBuilder = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TaskGroupResolverService,
        TaskDescriptionParser])
], TaskContextBuilder);
export { TaskContextBuilder };
//# sourceMappingURL=task-context.builder.js.map