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
import { BadRequestException, Inject, Injectable, NotFoundException, } from '@nestjs/common';
import { ParsingScope, ParsingTaskMode, } from '../dto/create-parsing-task.dto.js';
let TaskGroupResolverService = class TaskGroupResolverService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async resolveGroups(scope, groupIds) {
        if (scope === ParsingScope.ALL) {
            return this.repository.findGroups(scope, groupIds);
        }
        if (!groupIds?.length) {
            throw new BadRequestException('Необходимо указать идентификаторы групп для парсинга');
        }
        const groups = await this.repository.findGroups(scope, groupIds);
        if (groups.length !== groupIds.length) {
            const foundIds = new Set(groups.map((group) => group.id));
            const missing = groupIds.filter((id) => !foundIds.has(id));
            throw new NotFoundException(`Группы не найдены: ${missing.join(', ')}`);
        }
        return groups;
    }
    buildTaskTitle(scope, groups, mode = ParsingTaskMode.RECENT_POSTS) {
        const prefix = mode === ParsingTaskMode.RECHECK_GROUP ? 'Перепроверка' : 'Парсинг';
        if (scope === ParsingScope.ALL) {
            return `${prefix} всех групп (${groups.length})`;
        }
        if (groups.length === 1) {
            return `${prefix} группы: ${groups[0].name}`;
        }
        return `${prefix} выбранных групп (${groups.length})`;
    }
};
TaskGroupResolverService = __decorate([
    Injectable(),
    __param(0, Inject('IParsingTaskRepository')),
    __metadata("design:paramtypes", [Object])
], TaskGroupResolverService);
export { TaskGroupResolverService };
//# sourceMappingURL=task-group-resolver.service.js.map