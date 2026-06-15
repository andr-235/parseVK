import { PrismaService } from '../../prisma.service.js';
import type { ITelegramAuthRepository, TelegramSessionCreate, TelegramSessionRecord, TelegramSettingsRecord, TelegramSettingsUpdate } from '../interfaces/telegram-auth-repository.interface.js';
export declare class TelegramAuthRepository implements ITelegramAuthRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findLatestSettings(): Promise<TelegramSettingsRecord | null>;
    upsertSettings(data: TelegramSettingsUpdate): Promise<TelegramSettingsRecord>;
    findLatestSession(): Promise<TelegramSessionRecord | null>;
    replaceSession(data: TelegramSessionCreate): Promise<void>;
    deleteAllSessions(): Promise<number>;
}
