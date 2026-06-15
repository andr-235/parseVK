import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WatchlistService } from './watchlist.service.js';
export declare class WatchlistMonitorService implements OnModuleInit, OnModuleDestroy {
    private readonly watchlistService;
    private readonly logger;
    private intervalId;
    constructor(watchlistService: WatchlistService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private handleTick;
}
