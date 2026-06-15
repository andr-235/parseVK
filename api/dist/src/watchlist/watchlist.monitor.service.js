var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WatchlistMonitorService_1;
import { Injectable, Logger, } from '@nestjs/common';
import { WatchlistService } from './watchlist.service.js';
const MONITOR_INTERVAL_MS = 60_000;
let WatchlistMonitorService = WatchlistMonitorService_1 = class WatchlistMonitorService {
    watchlistService;
    logger = new Logger(WatchlistMonitorService_1.name);
    intervalId = null;
    constructor(watchlistService) {
        this.watchlistService = watchlistService;
    }
    onModuleInit() {
        void this.handleTick();
        this.intervalId = setInterval(() => {
            void this.handleTick();
        }, MONITOR_INTERVAL_MS);
    }
    onModuleDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    async handleTick() {
        try {
            await this.watchlistService.refreshActiveAuthors();
        }
        catch (error) {
            this.logger.error('Не удалось обновить авторов списка "На карандаше"', error instanceof Error ? error.stack : undefined);
        }
    }
};
WatchlistMonitorService = WatchlistMonitorService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [WatchlistService])
], WatchlistMonitorService);
export { WatchlistMonitorService };
//# sourceMappingURL=watchlist.monitor.service.js.map