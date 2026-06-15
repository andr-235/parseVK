import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { ITelegramAuthRepository } from './interfaces/telegram-auth-repository.interface.js';
import type { AppConfig } from '../config/app.config.js';
import type { ConfirmTelegramSessionDto, ConfirmTelegramSessionResponseDto } from './dto/confirm-session.dto.js';
import type { StartTelegramSessionDto, StartTelegramSessionResponseDto } from './dto/start-session.dto.js';
import type { TelegramSettingsDto, TelegramSettingsResponseDto } from './dto/telegram-settings.dto.js';
export declare class TelegramAuthService {
    private readonly configService;
    private readonly cache;
    private readonly repository;
    private readonly logger;
    private readonly defaultApiId;
    private readonly defaultApiHash;
    constructor(configService: ConfigService<AppConfig>, cache: Cache, repository: ITelegramAuthRepository);
    getSettings(): Promise<TelegramSettingsResponseDto | null>;
    updateSettings(payload: TelegramSettingsDto): Promise<TelegramSettingsResponseDto>;
    startSession(payload: StartTelegramSessionDto): Promise<StartTelegramSessionResponseDto>;
    getCurrentSession(): Promise<ConfirmTelegramSessionResponseDto | null>;
    confirmSession(payload: ConfirmTelegramSessionDto): Promise<ConfirmTelegramSessionResponseDto>;
    private createClient;
    private buildCacheKey;
    private saveSession;
    private deleteExistingSession;
    private stringifyError;
}
