var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramClientManagerService_1;
import { Injectable, InternalServerErrorException, Logger, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient, sessions } from 'telegram';
const { StringSession } = sessions;
import { PrismaService } from '../../prisma.service.js';
let TelegramClientManagerService = TelegramClientManagerService_1 = class TelegramClientManagerService {
    configService;
    prisma;
    logger = new Logger(TelegramClientManagerService_1.name);
    client = null;
    initializing = null;
    currentSessionId = null;
    unhandledRejectionHandler = null;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.unhandledRejectionHandler = (reason) => {
            if (reason instanceof Error &&
                reason.message.includes('TIMEOUT') &&
                reason.stack?.includes('telegram/client/updates.js')) {
                return;
            }
        };
        process.on('unhandledRejection', this.unhandledRejectionHandler);
    }
    onModuleDestroy() {
        if (this.unhandledRejectionHandler) {
            process.off('unhandledRejection', this.unhandledRejectionHandler);
        }
        if (this.client) {
            void this.client.disconnect();
        }
    }
    async getClient() {
        const sessionRecord = (await this.prisma.telegramSession.findFirst({
            orderBy: { updatedAt: 'desc' },
        }));
        if (this.client &&
            this.currentSessionId ===
                (sessionRecord?.id ?? null)) {
            return this.client;
        }
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
            this.currentSessionId = null;
        }
        if (!this.initializing) {
            this.initializing = this.initializeClient();
        }
        await this.initializing;
        if (!this.client) {
            throw new InternalServerErrorException('Telegram client initialization failed');
        }
        return this.client;
    }
    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
            this.currentSessionId = null;
        }
    }
    async initializeClient() {
        const settingsRecord = (await this.prisma.telegramSettings.findFirst({
            orderBy: { updatedAt: 'desc' },
        }));
        const apiIdRaw = settingsRecord?.apiId ??
            this.configService.get('telegramApiId', { infer: true });
        const apiHash = settingsRecord?.apiHash ??
            this.configService.get('telegramApiHash', { infer: true });
        const apiId = typeof apiIdRaw === 'string' ? Number.parseInt(apiIdRaw, 10) : apiIdRaw;
        if (!apiId || Number.isNaN(apiId)) {
            throw new InternalServerErrorException('TELEGRAM_API_ID is not configured. Please set it in Settings.');
        }
        if (!apiHash) {
            throw new InternalServerErrorException('TELEGRAM_API_HASH is not configured. Please set it in Settings.');
        }
        const sessionRecord = (await this.prisma.telegramSession.findFirst({
            orderBy: { updatedAt: 'desc' },
        }));
        const sessionString = sessionRecord?.session ??
            this.configService.get('telegramSession', { infer: true });
        if (!sessionString) {
            throw new InternalServerErrorException('TELEGRAM_SESSION is not configured. Please create a session first.');
        }
        try {
            const session = new StringSession(sessionString);
            const client = new TelegramClient(session, apiId, apiHash, {
                connectionRetries: 5,
            });
            await client.connect();
            this.client = client;
            this.currentSessionId =
                sessionRecord?.id ?? null;
            this.logger.log('Telegram client initialized');
        }
        catch (error) {
            this.logger.error('Telegram client initialization error', error);
            throw new InternalServerErrorException('Failed to initialize Telegram client');
        }
        finally {
            this.initializing = null;
        }
    }
};
TelegramClientManagerService = TelegramClientManagerService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        PrismaService])
], TelegramClientManagerService);
export { TelegramClientManagerService };
//# sourceMappingURL=telegram-client-manager.service.js.map