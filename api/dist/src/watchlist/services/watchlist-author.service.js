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
var WatchlistAuthorService_1;
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { CommentSource } from '../../common/types/comment-source.enum.js';
import { WatchlistStatus } from '../types/watchlist-status.enum.js';
import { WatchlistAuthorMapper } from '../mappers/watchlist-author.mapper.js';
import { WatchlistStatsCollectorService } from './watchlist-stats-collector.service.js';
import { WatchlistAuthorRefresherService } from './watchlist-author-refresher.service.js';
import { WatchlistQueryValidator } from '../validators/watchlist-query.validator.js';
import { AuthorsSaverService } from '../../common/services/authors-saver.service.js';
let WatchlistAuthorService = WatchlistAuthorService_1 = class WatchlistAuthorService {
    repository;
    authorMapper;
    statsCollector;
    authorRefresher;
    queryValidator;
    authorsSaver;
    logger = new Logger(WatchlistAuthorService_1.name);
    lastRefreshTimestamp = 0;
    constructor(repository, authorMapper, statsCollector, authorRefresher, queryValidator, authorsSaver) {
        this.repository = repository;
        this.authorMapper = authorMapper;
        this.statsCollector = statsCollector;
        this.authorRefresher = authorRefresher;
        this.queryValidator = queryValidator;
        this.authorsSaver = authorsSaver;
    }
    async getAuthors(params = {}) {
        const settings = await this.repository.ensureSettings();
        const offset = this.queryValidator.normalizeOffset(params.offset);
        const limit = this.queryValidator.normalizeLimit(params.limit);
        const excludeStopped = this.queryValidator.normalizeExcludeStopped(params.excludeStopped);
        const { items: records, total } = await this.repository.findMany({
            settingsId: settings.id,
            excludeStopped,
            offset,
            limit,
        });
        const recordIds = records.map((record) => record.id);
        const commentCounts = await this.statsCollector.collectCommentCounts(recordIds);
        const summaryMap = await this.statsCollector.collectAnalysisSummaries(records);
        const items = records.map((record) => this.authorMapper.mapAuthor(record, commentCounts.get(record.id) ?? 0, this.statsCollector.resolveSummary(record, summaryMap)));
        return {
            items,
            total,
            hasMore: offset + items.length < total,
        };
    }
    async getAuthorDetails(id, params = {}) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw new NotFoundException('Автор списка "На карандаше" не найден');
        }
        const offset = this.queryValidator.normalizeOffset(params.offset);
        const limit = this.queryValidator.normalizeLimit(params.limit);
        const { items: comments, total } = await this.repository.getAuthorComments({
            watchlistAuthorId: id,
            offset,
            limit,
        });
        const commentDtos = comments.map((comment) => this.authorMapper.mapComment({
            id: comment.id,
            ownerId: comment.ownerId,
            postId: comment.postId,
            vkCommentId: comment.vkCommentId,
            text: comment.text,
            publishedAt: comment.publishedAt,
            createdAt: comment.createdAt,
            source: comment.source,
        }));
        const summaryMap = await this.statsCollector.collectAnalysisSummaries([
            record,
        ]);
        return {
            ...this.authorMapper.mapAuthor(record, total, this.statsCollector.resolveSummary(record, summaryMap)),
            comments: {
                items: commentDtos,
                total,
                hasMore: offset + commentDtos.length < total,
            },
        };
    }
    async createAuthor(dto) {
        if (typeof dto.commentId !== 'number' &&
            typeof dto.authorVkId !== 'number') {
            throw new BadRequestException('Нужно указать commentId или authorVkId');
        }
        const settings = await this.repository.ensureSettings();
        let authorVkId = dto.authorVkId ?? null;
        let sourceCommentId = null;
        if (typeof dto.commentId === 'number') {
            const comment = await this.repository.findCommentById(dto.commentId);
            if (!comment) {
                throw new NotFoundException('Комментарий не найден');
            }
            sourceCommentId = comment.id;
            const fromId = comment.fromId;
            authorVkId = comment.authorVkId ?? (fromId > 0 ? fromId : null);
            if (!authorVkId) {
                throw new BadRequestException('Не удалось определить автора по указанному комментарию');
            }
        }
        if (!authorVkId || authorVkId <= 0) {
            throw new BadRequestException('Идентификатор автора должен быть положительным числом');
        }
        const existing = await this.repository.findByAuthorVkIdAndSettingsId(authorVkId, settings.id);
        if (existing) {
            throw new ConflictException('Автор уже находится в списке "На карандаше"');
        }
        await this.authorsSaver.saveAuthors([authorVkId]);
        const record = await this.repository.create({
            authorVkId,
            sourceCommentId,
            settingsId: settings.id,
            status: WatchlistStatus.ACTIVE,
        });
        if (sourceCommentId) {
            await this.repository.updateComment(sourceCommentId, {
                watchlistAuthorId: record.id,
                source: CommentSource.WATCHLIST,
            });
        }
        const commentsCount = await this.repository.countComments(record.id);
        this.logger.log(`Добавлен автор ${authorVkId} в список "На карандаше"`);
        const summaryMap = await this.statsCollector.collectAnalysisSummaries([
            record,
        ]);
        return this.authorMapper.mapAuthor(record, commentsCount, this.statsCollector.resolveSummary(record, summaryMap));
    }
    async updateAuthor(id, dto) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw new NotFoundException('Автор списка "На карандаше" не найден');
        }
        const data = {};
        if (dto.status && dto.status !== record.status) {
            data.status = dto.status;
            if (dto.status === WatchlistStatus.ACTIVE) {
                data.monitoringStoppedAt = null;
            }
            else if (dto.status === WatchlistStatus.STOPPED) {
                data.monitoringStoppedAt = new Date();
            }
        }
        if (Object.keys(data).length === 0) {
            const commentsCount = await this.repository.countComments(id);
            const summaryMap = await this.statsCollector.collectAnalysisSummaries([
                record,
            ]);
            return this.authorMapper.mapAuthor(record, commentsCount, this.statsCollector.resolveSummary(record, summaryMap));
        }
        const updated = await this.repository.update(id, data);
        const commentsCount = await this.repository.countComments(id);
        const summaryMap = await this.statsCollector.collectAnalysisSummaries([
            updated,
        ]);
        return this.authorMapper.mapAuthor(updated, commentsCount, this.statsCollector.resolveSummary(updated, summaryMap));
    }
    async refreshActiveAuthors() {
        const settings = await this.repository.ensureSettings();
        if (this.shouldSkipRefresh(settings.pollIntervalMinutes)) {
            return;
        }
        this.lastRefreshTimestamp = Date.now();
        const activeAuthors = await this.repository.findActiveAuthors({
            settingsId: settings.id,
            limit: Math.max(settings.maxAuthors, 1),
        });
        if (!activeAuthors.length) {
            return;
        }
        await this.authorsSaver.saveAuthors(activeAuthors.map((author) => author.authorVkId));
        if (!settings.trackAllComments) {
            const timestamp = new Date();
            await this.repository.updateMany(activeAuthors.map((author) => author.id), { lastCheckedAt: timestamp });
            this.logger.debug('Мониторинг всех комментариев отключен, обновлены только метки проверки авторов');
            return;
        }
        let totalNewComments = 0;
        for (const author of activeAuthors) {
            const newComments = await this.authorRefresher.refreshAuthorRecord(author);
            totalNewComments += newComments;
        }
        this.logger.debug(`Обработано ${activeAuthors.length} авторов "На карандаше", найдено новых комментариев: ${totalNewComments}`);
    }
    shouldSkipRefresh(pollIntervalMinutes) {
        if (!this.lastRefreshTimestamp) {
            return false;
        }
        const interval = Math.max(pollIntervalMinutes, 1) * 60_000;
        const elapsed = Date.now() - this.lastRefreshTimestamp;
        return elapsed < interval;
    }
};
WatchlistAuthorService = WatchlistAuthorService_1 = __decorate([
    Injectable(),
    __param(0, Inject('IWatchlistRepository')),
    __metadata("design:paramtypes", [Object, WatchlistAuthorMapper,
        WatchlistStatsCollectorService,
        WatchlistAuthorRefresherService,
        WatchlistQueryValidator,
        AuthorsSaverService])
], WatchlistAuthorService);
export { WatchlistAuthorService };
//# sourceMappingURL=watchlist-author.service.js.map