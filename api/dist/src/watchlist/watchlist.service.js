var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { WatchlistAuthorService } from './services/watchlist-author.service.js';
import { WatchlistSettingsService } from './services/watchlist-settings.service.js';
let WatchlistService = class WatchlistService {
    authorService;
    settingsService;
    constructor(authorService, settingsService) {
        this.authorService = authorService;
        this.settingsService = settingsService;
    }
    async getAuthors(params = {}) {
        return this.authorService.getAuthors(params);
    }
    async getAuthorDetails(id, params = {}) {
        return this.authorService.getAuthorDetails(id, params);
    }
    async createAuthor(dto) {
        return this.authorService.createAuthor(dto);
    }
    async updateAuthor(id, dto) {
        return this.authorService.updateAuthor(id, dto);
    }
    async getSettings() {
        return this.settingsService.getSettings();
    }
    async updateSettings(dto) {
        return this.settingsService.updateSettings(dto);
    }
    async refreshActiveAuthors() {
        return this.authorService.refreshActiveAuthors();
    }
};
WatchlistService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [WatchlistAuthorService,
        WatchlistSettingsService])
], WatchlistService);
export { WatchlistService };
//# sourceMappingURL=watchlist.service.js.map