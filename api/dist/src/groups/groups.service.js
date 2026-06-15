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
var GroupsService_1;
import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, } from '@nestjs/common';
import { VkService } from '../vk/vk.service.js';
import { GroupMapper } from './mappers/group.mapper.js';
import { GroupIdentifierValidator } from './validators/group-identifier.validator.js';
let GroupsService = GroupsService_1 = class GroupsService {
    repository;
    vkService;
    groupMapper;
    identifierValidator;
    logger = new Logger(GroupsService_1.name);
    constructor(repository, vkService, groupMapper, identifierValidator) {
        this.repository = repository;
        this.vkService = vkService;
        this.groupMapper = groupMapper;
        this.identifierValidator = identifierValidator;
    }
    async saveGroup(identifier) {
        const parsedIdentifier = this.identifierValidator.normalizeIdentifier(identifier);
        const response = await this.vkService.getGroups(parsedIdentifier);
        if (!response?.groups || response.groups.length === 0) {
            this.logger.warn(`Группа ${parsedIdentifier} не найдена`);
            throw new NotFoundException(`Group ${parsedIdentifier} not found`);
        }
        const groupData = response.groups[0];
        const mappedData = this.groupMapper.mapGroupData(groupData);
        const group = await this.repository.upsert({ vkId: groupData.id }, {
            vkId: groupData.id,
            ...mappedData,
            addresses: mappedData.addresses ?? undefined,
            city: mappedData.city ?? undefined,
            counters: mappedData.counters ?? undefined,
        });
        this.logger.log(`Группа ${groupData.id} сохранена в базе (id записи ${group.id})`);
        return group;
    }
    async getAllGroups(params) {
        const page = params?.page && params.page > 0 ? params.page : 1;
        const limit = params?.limit && params.limit > 0 && params.limit <= 200
            ? params.limit
            : 50;
        const skip = (page - 1) * limit;
        const { items, total } = await this.repository.getGroupsWithCount({
            skip,
            take: limit,
        });
        const hasMore = skip + items.length < total;
        return {
            items,
            total,
            page,
            limit,
            hasMore,
        };
    }
    async deleteGroup(id) {
        return this.repository.delete({ id });
    }
    async deleteAllGroups() {
        return this.repository.deleteMany();
    }
    async bulkSaveGroups(identifiers) {
        const success = [];
        const failed = [];
        const batchSize = 3;
        const seen = new Set();
        const uniqueEntries = [];
        for (const originalIdentifier of identifiers) {
            const parsedIdentifier = this.identifierValidator.normalizeIdentifier(originalIdentifier);
            const normalizedKey = String(parsedIdentifier).toLowerCase();
            if (seen.has(normalizedKey)) {
                failed.push({
                    identifier: originalIdentifier,
                    errorMessage: 'Дубликат в списке идентификаторов',
                });
                continue;
            }
            seen.add(normalizedKey);
            uniqueEntries.push({
                originalIdentifier,
                parsedIdentifier,
            });
        }
        for (let i = 0; i < uniqueEntries.length; i += batchSize) {
            const batch = uniqueEntries.slice(i, i + batchSize);
            const batchPromises = batch.map(async ({ parsedIdentifier, originalIdentifier }) => {
                try {
                    const group = await this.saveGroup(parsedIdentifier);
                    success.push(group);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    failed.push({
                        identifier: originalIdentifier,
                        errorMessage,
                    });
                }
            });
            await Promise.all(batchPromises);
            if (i + batchSize < uniqueEntries.length) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
        }
        this.logger.log(`Загрузка групп завершена: всего ${identifiers.length}, успешно ${success.length}, с ошибками ${failed.length}`);
        return {
            success,
            failed,
            total: identifiers.length,
            successCount: success.length,
            failedCount: failed.length,
        };
    }
    async uploadGroupsFromFile(fileContent) {
        const identifiers = fileContent
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        return this.bulkSaveGroups(identifiers);
    }
    async searchRegionGroups() {
        try {
            this.logger.log('Запуск поиска групп по региону "Еврейская автономная область"');
            const groups = await this.vkService.searchGroupsByRegion({});
            if (!groups.length) {
                this.logger.log('VK API не вернул групп для заданного региона');
                return {
                    total: 0,
                    groups: [],
                    existsInDb: [],
                    missing: [],
                };
            }
            const vkIds = groups.map((group) => group.id);
            const existing = await this.repository.findManyByVkIds(vkIds);
            const existingIds = new Set(existing.map((group) => group.vkId));
            const items = groups.map((group) => ({
                ...group,
                existsInDb: existingIds.has(group.id),
            }));
            const existsInDb = items.filter((item) => item.existsInDb);
            const missing = items.filter((item) => !item.existsInDb);
            this.logger.log(`Поиск завершён: всего в VK ${items.length}, в базе ${existsInDb.length}, уникальных к добавлению ${missing.length}`);
            return {
                total: items.length,
                groups: items,
                existsInDb,
                missing,
            };
        }
        catch (error) {
            if (error instanceof Error && error.message === 'REGION_NOT_FOUND') {
                this.logger.warn('Попытка поиска по отсутствующему региону "Еврейская автономная область"');
                throw new NotFoundException('Регион "Еврейская автономная область" не найден в VK');
            }
            this.logger.error('Не удалось выполнить поиск групп по региону', error instanceof Error ? error.stack : String(error));
            throw new InternalServerErrorException('Не удалось выполнить поиск групп по региону');
        }
    }
};
GroupsService = GroupsService_1 = __decorate([
    Injectable(),
    __param(0, Inject('IGroupsRepository')),
    __metadata("design:paramtypes", [Object, VkService,
        GroupMapper,
        GroupIdentifierValidator])
], GroupsService);
export { GroupsService };
//# sourceMappingURL=groups.service.js.map