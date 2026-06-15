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
var TelegramAuthService_1;
import { BadRequestException, Injectable, InternalServerErrorException, Logger, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TelegramClient, Api, sessions } from 'telegram';
const { StringSession } = sessions;
const CACHE_PREFIX = 'telegram:auth:tx:';
const DEFAULT_CODE_LENGTH = 5;
const TRANSACTION_TTL_SEC = 5 * 60;
let TelegramAuthService = TelegramAuthService_1 = class TelegramAuthService {
    configService;
    cache;
    repository;
    logger = new Logger(TelegramAuthService_1.name);
    defaultApiId;
    defaultApiHash;
    constructor(configService, cache, repository) {
        this.configService = configService;
        this.cache = cache;
        this.repository = repository;
        const apiIdRaw = this.configService.get('telegramApiId', { infer: true });
        const apiHash = this.configService.get('telegramApiHash', { infer: true });
        const parsedApiId = typeof apiIdRaw === 'string' ? Number.parseInt(apiIdRaw, 10) : apiIdRaw;
        this.defaultApiId =
            parsedApiId && !Number.isNaN(parsedApiId) ? parsedApiId : null;
        this.defaultApiHash = apiHash || null;
    }
    async getSettings() {
        const settings = await this.repository.findLatestSettings();
        if (!settings) {
            return null;
        }
        return {
            phoneNumber: settings.phoneNumber,
            apiId: settings.apiId,
            apiHash: settings.apiHash,
            createdAt: settings.createdAt.toISOString(),
            updatedAt: settings.updatedAt.toISOString(),
        };
    }
    async updateSettings(payload) {
        const settings = await this.repository.upsertSettings({
            phoneNumber: payload.phoneNumber ?? undefined,
            apiId: payload.apiId ?? undefined,
            apiHash: payload.apiHash ?? undefined,
        });
        return {
            phoneNumber: settings.phoneNumber,
            apiId: settings.apiId,
            apiHash: settings.apiHash,
            createdAt: settings.createdAt.toISOString(),
            updatedAt: settings.updatedAt.toISOString(),
        };
    }
    async startSession(payload) {
        const savedSettings = await this.repository.findLatestSettings();
        const phoneNumber = payload.phoneNumber?.trim() ?? savedSettings?.phoneNumber?.trim() ?? null;
        if (!phoneNumber) {
            throw new BadRequestException('PHONE_NUMBER_REQUIRED');
        }
        const apiId = payload.apiId ?? savedSettings?.apiId ?? this.defaultApiId;
        const apiHash = payload.apiHash ?? savedSettings?.apiHash ?? this.defaultApiHash;
        if (!apiId || !apiHash) {
            throw new BadRequestException('API_ID_AND_HASH_REQUIRED');
        }
        await this.deleteExistingSession();
        const client = await this.createClient('', apiId, apiHash);
        try {
            const response = await client.sendCode({
                apiId,
                apiHash,
            }, phoneNumber, false);
            const transactionId = randomUUID();
            const sessionString = client.session.save();
            const state = {
                phoneNumber,
                phoneCodeHash: response.phoneCodeHash,
                session: sessionString,
                apiId,
                apiHash,
                createdAt: new Date().toISOString(),
            };
            await this.cache.set(this.buildCacheKey(transactionId), state, TRANSACTION_TTL_SEC * 1000);
            return {
                transactionId,
                codeLength: DEFAULT_CODE_LENGTH,
                nextType: response.isCodeViaApp ? 'app' : 'sms',
                timeoutSec: null,
            };
        }
        catch (error) {
            this.logger.error(`Failed to send Telegram code for ${phoneNumber}: ${this.stringifyError(error)}`);
            if (error instanceof Error && 'errorMessage' in error) {
                throw new BadRequestException(error.errorMessage ?? 'TELEGRAM_ERROR');
            }
            throw new InternalServerErrorException('TELEGRAM_SEND_CODE_FAILED');
        }
        finally {
            await client.disconnect();
        }
    }
    async getCurrentSession() {
        const sessionRecord = await this.repository.findLatestSession();
        if (!sessionRecord) {
            return null;
        }
        return {
            session: sessionRecord.session,
            expiresAt: null,
            userId: sessionRecord.userId ?? 0,
            username: sessionRecord.username,
            phoneNumber: sessionRecord
                .phoneNumber,
        };
    }
    async confirmSession(payload) {
        const transaction = await this.cache.get(this.buildCacheKey(payload.transactionId));
        if (!transaction) {
            throw new BadRequestException('TRANSACTION_NOT_FOUND_OR_EXPIRED');
        }
        const client = await this.createClient(transaction.session, transaction.apiId, transaction.apiHash);
        try {
            let me;
            try {
                me = await client.signInUser({
                    apiId: transaction.apiId,
                    apiHash: transaction.apiHash,
                }, {
                    phoneNumber: transaction.phoneNumber,
                    phoneCode: () => Promise.resolve(payload.code),
                    password: payload.password
                        ? () => Promise.resolve(payload.password)
                        : undefined,
                    onError: (err) => {
                        this.logger.warn(`Telegram signIn error for ${transaction.phoneNumber}: ${this.stringifyError(err)}`);
                        if (err.message.includes('PASSWORD') ||
                            err.message.includes('password')) {
                            return Promise.resolve(false);
                        }
                        return Promise.resolve(true);
                    },
                });
            }
            catch (error) {
                if (error instanceof Error &&
                    (error.message.includes('PASSWORD') ||
                        error.message.includes('password'))) {
                    if (!payload.password) {
                        throw new BadRequestException('PASSWORD_REQUIRED');
                    }
                    me = await client.signInWithPassword({
                        apiId: transaction.apiId,
                        apiHash: transaction.apiHash,
                    }, {
                        password: () => Promise.resolve(payload.password),
                        onError: (err) => {
                            this.logger.warn(`Telegram password check failed for ${transaction.phoneNumber}: ${this.stringifyError(err)}`);
                            return Promise.resolve(true);
                        },
                    });
                }
                else {
                    this.logger.warn(`Telegram signIn failed for ${transaction.phoneNumber}: ${this.stringifyError(error)}`);
                    throw new BadRequestException(error instanceof Error ? error.message : 'TELEGRAM_SIGN_IN_FAILED');
                }
            }
            const session = client.session.save();
            await this.cache.del(this.buildCacheKey(payload.transactionId));
            const userId = typeof me.id === 'bigint'
                ? Number(me.id)
                : typeof me.id === 'number'
                    ? me.id
                    : 0;
            const username = me instanceof Api.User && me.username ? me.username : null;
            const phoneNumber = me instanceof Api.User && me.phone ? me.phone : null;
            await this.saveSession(session, userId, username, phoneNumber);
            return {
                session,
                expiresAt: null,
                userId,
                username,
                phoneNumber,
            };
        }
        finally {
            await client.disconnect();
        }
    }
    async createClient(session, apiId, apiHash) {
        const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
            connectionRetries: 5,
        });
        await client.connect();
        return client;
    }
    buildCacheKey(transactionId) {
        return `${CACHE_PREFIX}${transactionId}`;
    }
    async saveSession(session, userId, username, phoneNumber) {
        await this.repository.replaceSession({
            session,
            userId: userId > 0 ? userId : null,
            username,
            phoneNumber,
        });
        this.logger.log('Telegram session saved to database');
    }
    async deleteExistingSession() {
        const deleted = await this.repository.deleteAllSessions();
        if (deleted > 0) {
            this.logger.log('Existing Telegram session deleted');
        }
    }
    stringifyError(error) {
        if (error instanceof Error) {
            return `${error.name}: ${error.message}`;
        }
        try {
            return JSON.stringify(error);
        }
        catch {
            return String(error);
        }
    }
};
TelegramAuthService = TelegramAuthService_1 = __decorate([
    Injectable(),
    __param(1, Inject(CACHE_MANAGER)),
    __param(2, Inject('ITelegramAuthRepository')),
    __metadata("design:paramtypes", [ConfigService, Object, Object])
], TelegramAuthService);
export { TelegramAuthService };
//# sourceMappingURL=telegram-auth.service.js.map