import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { PrismaService } from '../../prisma.service.js';
import type { ITelegramClient } from '../interfaces/telegram-client.interface.js';
import type { AppConfig } from '../../config/app.config.js';
export declare class TelegramClientManagerService implements ITelegramClient, OnModuleDestroy {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private client;
    private initializing;
    private currentSessionId;
    private unhandledRejectionHandler;
    constructor(configService: ConfigService<AppConfig>, prisma: PrismaService);
    private setupErrorHandling;
    onModuleDestroy(): void;
    getClient(): Promise<TelegramClient>;
    disconnect(): Promise<void>;
    private initializeClient;
}
