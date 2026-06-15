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
import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query, } from '@nestjs/common';
import { WatchlistService } from './watchlist.service.js';
import { CreateWatchlistAuthorDto } from './dto/create-watchlist-author.dto.js';
import { UpdateWatchlistAuthorDto } from './dto/update-watchlist-author.dto.js';
import { UpdateWatchlistSettingsDto } from './dto/update-watchlist-settings.dto.js';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;
let WatchlistController = class WatchlistController {
    watchlistService;
    constructor(watchlistService) {
        this.watchlistService = watchlistService;
    }
    async listAuthors(offset, limit, excludeStoppedRaw) {
        const normalizedOffset = Math.max(offset, 0);
        const normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        const excludeStopped = String(excludeStoppedRaw).toLowerCase() !== 'false';
        return this.watchlistService.getAuthors({
            offset: normalizedOffset,
            limit: normalizedLimit,
            excludeStopped,
        });
    }
    async createAuthor(dto) {
        return this.watchlistService.createAuthor(dto);
    }
    async getAuthorDetails(id, offset, limit) {
        const normalizedOffset = Math.max(offset, 0);
        const normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        return this.watchlistService.getAuthorDetails(id, {
            offset: normalizedOffset,
            limit: normalizedLimit,
        });
    }
    async updateAuthor(id, dto) {
        return this.watchlistService.updateAuthor(id, dto);
    }
    async getSettings() {
        return this.watchlistService.getSettings();
    }
    async updateSettings(dto) {
        return this.watchlistService.updateSettings(dto);
    }
};
__decorate([
    Get('authors'),
    __param(0, Query('offset', new DefaultValuePipe(0), ParseIntPipe)),
    __param(1, Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)),
    __param(2, Query('excludeStopped', new DefaultValuePipe(true))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "listAuthors", null);
__decorate([
    Post('authors'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateWatchlistAuthorDto]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "createAuthor", null);
__decorate([
    Get('authors/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Query('offset', new DefaultValuePipe(0), ParseIntPipe)),
    __param(2, Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "getAuthorDetails", null);
__decorate([
    Patch('authors/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateWatchlistAuthorDto]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "updateAuthor", null);
__decorate([
    Get('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "getSettings", null);
__decorate([
    Patch('settings'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateWatchlistSettingsDto]),
    __metadata("design:returntype", Promise)
], WatchlistController.prototype, "updateSettings", null);
WatchlistController = __decorate([
    Controller('watchlist'),
    __metadata("design:paramtypes", [WatchlistService])
], WatchlistController);
export { WatchlistController };
//# sourceMappingURL=watchlist.controller.js.map