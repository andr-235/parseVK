var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { KeywordsService } from '../keywords/keywords.service.js';
import { MonitorDatabaseService } from './monitor-database.service.js';
const normalizeKeywords = (values) => {
    const normalized = values
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    return Array.from(new Set(normalized));
};
const normalizeDate = (value) => {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};
const isRecord = (value) => typeof value === 'object' && value !== null;
const getStringValue = (value) => {
    if (typeof value !== 'string') {
        return null;
    }
    if (value.trim().length === 0) {
        return null;
    }
    return value;
};
const pickStringValue = (...values) => {
    for (const value of values) {
        const resolved = getStringValue(value);
        if (resolved) {
            return resolved;
        }
    }
    return null;
};
const parseMetadata = (value) => {
    if (!value) {
        return null;
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return isRecord(parsed) ? parsed : null;
        }
        catch {
            return null;
        }
    }
    return isRecord(value) ? value : null;
};
const extractMetadata = (value) => {
    const metadata = parseMetadata(value);
    if (!metadata) {
        return { text: null, url: null, type: null, chatName: null };
    }
    const raw = isRecord(metadata.raw) ? metadata.raw : null;
    const rawS3 = raw && isRecord(raw.s3Info) ? raw.s3Info : null;
    const text = pickStringValue(raw?.body, raw?.caption, raw?.text, metadata.text);
    const url = pickStringValue(rawS3?.url, rawS3?.link, raw?.file_url, raw?.fileUrl, raw?.url, metadata.url);
    const type = pickStringValue(raw?.mimetype, raw?.type, metadata.type);
    const chatName = pickStringValue(metadata.chat_name, metadata.chatName, raw?.chat_name, raw?.chatName, raw?.chat, raw?.title);
    return { text, url, type, chatName };
};
let MonitoringService = class MonitoringService {
    monitorDb;
    keywordsService;
    constructor(monitorDb, keywordsService) {
        this.monitorDb = monitorDb;
        this.keywordsService = keywordsService;
    }
    async getMessages(options) {
        if (!this.monitorDb.isReady) {
            throw new ServiceUnavailableException('Мониторинг недоступен: MONITOR_DATABASE_URL не настроен.');
        }
        const keywords = options.keywords?.length
            ? normalizeKeywords(options.keywords)
            : await this.getDefaultKeywords();
        const limit = Math.max(options.limit, 1);
        const page = Math.max(options.page, 1);
        const from = options.from ?? null;
        if (keywords.length === 0) {
            return {
                items: [],
                total: 0,
                usedKeywords: [],
                lastSyncAt: new Date().toISOString(),
                page,
                limit,
                hasMore: false,
            };
        }
        const offset = (page - 1) * limit;
        const rows = await this.monitorDb.findMessages({
            keywords,
            limit: limit + 1,
            offset,
            from: from ?? undefined,
            sources: options.sources,
        });
        const hasMore = rows.length > limit;
        const slicedRows = hasMore ? rows.slice(0, limit) : rows;
        const items = slicedRows.map((row) => {
            const metadata = extractMetadata(row.metadata);
            const text = getStringValue(row.text) ?? metadata.text ?? null;
            return {
                id: typeof row.id === 'bigint'
                    ? row.id.toString()
                    : row.id,
                text,
                createdAt: normalizeDate(row.createdAt ?? null),
                author: row.author ?? null,
                chat: row.chat ?? metadata.chatName ?? null,
                source: row.source ?? null,
                contentUrl: metadata.url ?? null,
                contentType: metadata.type ?? null,
            };
        });
        return {
            items,
            total: items.length,
            usedKeywords: keywords,
            lastSyncAt: new Date().toISOString(),
            page,
            limit,
            hasMore,
        };
    }
    async getDefaultKeywords() {
        const monitorKeywords = await this.monitorDb.findKeywords();
        if (monitorKeywords !== null) {
            return normalizeKeywords(monitorKeywords);
        }
        return this.keywordsService.getKeywordWords();
    }
};
MonitoringService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MonitorDatabaseService,
        KeywordsService])
], MonitoringService);
export { MonitoringService };
//# sourceMappingURL=monitoring.service.js.map