var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthorsSaverService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { VkService } from '../../vk/vk.service.js';
import { toUpdateJsonValue, toCreateJsonValue, } from '../utils/prisma-json.utils.js';
import { AUTHORS_REFRESH_BATCH_SIZE } from '../constants/processing.constants.js';
let AuthorsSaverService = AuthorsSaverService_1 = class AuthorsSaverService {
    prisma;
    vkService;
    logger = new Logger(AuthorsSaverService_1.name);
    constructor(prisma, vkService) {
        this.prisma = prisma;
        this.vkService = vkService;
    }
    async refreshAllAuthors(batchSize = AUTHORS_REFRESH_BATCH_SIZE) {
        const existingAuthors = await this.prisma.author.findMany({
            select: { vkUserId: true },
            where: { vkUserId: { gt: 0 } },
            orderBy: { vkUserId: 'asc' },
        });
        this.logger.log(`[refreshAllAuthors] Найдено авторов для обновления: ${existingAuthors.length}`);
        if (!existingAuthors.length) {
            return 0;
        }
        let totalUpdated = 0;
        for (let index = 0; index < existingAuthors.length; index += batchSize) {
            const chunk = existingAuthors
                .slice(index, index + batchSize)
                .map((author) => author.vkUserId);
            if (!chunk.length) {
                continue;
            }
            totalUpdated += await this.saveAuthors(chunk);
        }
        this.logger.log(`[refreshAllAuthors] Обновлено авторов: ${totalUpdated}`);
        return totalUpdated;
    }
    async saveAuthors(userIds) {
        if (!userIds.length) {
            return 0;
        }
        const uniqueIds = Array.from(new Set(userIds.filter((id) => id > 0)));
        if (!uniqueIds.length) {
            return 0;
        }
        this.logger.debug(`[saveAuthors] Запрос VK API для ${uniqueIds.length} авторов`);
        const authors = await this.vkService.getAuthors(uniqueIds);
        for (const author of authors) {
            const updateData = this.buildAuthorUpdateData(author);
            const createData = this.buildAuthorCreateData(author);
            await this.prisma.author.upsert({
                where: { vkUserId: author.id },
                update: updateData,
                create: createData,
            });
        }
        this.logger.debug(`[saveAuthors] Сохранено авторов: ${authors.length}`);
        return authors.length;
    }
    buildAuthorBaseFields(author, jsonValueConverter, useNullCoalescing) {
        const getValue = (value) => {
            return useNullCoalescing ? (value ?? null) : value;
        };
        return {
            firstName: author.first_name,
            lastName: author.last_name,
            deactivated: getValue(author.deactivated),
            domain: getValue(author.domain),
            screenName: getValue(author.screen_name),
            isClosed: getValue(author.is_closed),
            canAccessClosed: getValue(author.can_access_closed),
            photo50: getValue(author.photo_50),
            photo100: getValue(author.photo_100),
            photo200: getValue(author.photo_200),
            photo200Orig: getValue(author.photo_200_orig),
            photo400Orig: getValue(author.photo_400_orig),
            photoMax: getValue(author.photo_max),
            photoMaxOrig: getValue(author.photo_max_orig),
            photoId: getValue(author.photo_id),
            city: jsonValueConverter(author.city),
            country: jsonValueConverter(author.country),
            about: author.about ?? null,
            activities: author.activities ?? null,
            bdate: author.bdate ?? null,
            books: author.books ?? null,
            career: jsonValueConverter(author.career),
            connections: jsonValueConverter(author.connections),
            contacts: jsonValueConverter(author.contacts),
            counters: jsonValueConverter(author.counters),
            education: jsonValueConverter(author.education),
            followersCount: author.followers_count ?? null,
            homeTown: author.home_town ?? null,
            interests: author.interests ?? null,
            lastSeen: jsonValueConverter(author.last_seen),
            maidenName: author.maiden_name ?? null,
            military: jsonValueConverter(author.military),
            movies: author.movies ?? null,
            music: author.music ?? null,
            nickname: author.nickname ?? null,
            occupation: jsonValueConverter(author.occupation),
            personal: jsonValueConverter(author.personal),
            relatives: jsonValueConverter(author.relatives),
            relation: author.relation ?? null,
            schools: jsonValueConverter(author.schools),
            sex: author.sex ?? null,
            site: author.site ?? null,
            status: author.status ?? null,
            timezone: author.timezone ?? null,
            tv: author.tv ?? null,
            universities: jsonValueConverter(author.universities),
        };
    }
    buildAuthorUpdateData(author) {
        return this.buildAuthorBaseFields(author, toUpdateJsonValue, false);
    }
    buildAuthorCreateData(author) {
        return {
            vkUserId: author.id,
            ...this.buildAuthorBaseFields(author, toCreateJsonValue, true),
        };
    }
};
AuthorsSaverService = AuthorsSaverService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        VkService])
], AuthorsSaverService);
export { AuthorsSaverService };
//# sourceMappingURL=authors-saver.service.js.map