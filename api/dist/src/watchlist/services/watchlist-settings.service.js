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
var WatchlistSettingsService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WatchlistSettingsMapper } from '../mappers/watchlist-settings.mapper.js';
let WatchlistSettingsService = WatchlistSettingsService_1 = class WatchlistSettingsService {
    repository;
    settingsMapper;
    logger = new Logger(WatchlistSettingsService_1.name);
    constructor(repository, settingsMapper) {
        this.repository = repository;
        this.settingsMapper = settingsMapper;
    }
    async getSettings() {
        const settings = await this.repository.ensureSettings();
        return this.settingsMapper.map(settings);
    }
    async updateSettings(dto) {
        const settings = await this.repository.ensureSettings();
        const data = {};
        if (typeof dto.trackAllComments === 'boolean') {
            data.trackAllComments = dto.trackAllComments;
        }
        if (typeof dto.pollIntervalMinutes === 'number') {
            data.pollIntervalMinutes = dto.pollIntervalMinutes;
        }
        if (typeof dto.maxAuthors === 'number') {
            data.maxAuthors = dto.maxAuthors;
        }
        const updated = await this.repository.updateSettings(settings.id, data);
        this.logger.log('Обновлены настройки мониторинга авторов');
        return this.settingsMapper.map(updated);
    }
};
WatchlistSettingsService = WatchlistSettingsService_1 = __decorate([
    Injectable(),
    __param(0, Inject('IWatchlistRepository')),
    __metadata("design:paramtypes", [Object, WatchlistSettingsMapper])
], WatchlistSettingsService);
export { WatchlistSettingsService };
//# sourceMappingURL=watchlist-settings.service.js.map