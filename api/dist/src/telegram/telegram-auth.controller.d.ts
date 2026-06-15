import { TelegramAuthService } from './telegram-auth.service.js';
import { StartTelegramSessionDto, StartTelegramSessionResponseDto } from './dto/start-session.dto.js';
import { ConfirmTelegramSessionDto, ConfirmTelegramSessionResponseDto } from './dto/confirm-session.dto.js';
import { TelegramSettingsDto, TelegramSettingsResponseDto } from './dto/telegram-settings.dto.js';
export declare class TelegramAuthController {
    private readonly telegramAuthService;
    constructor(telegramAuthService: TelegramAuthService);
    getSettings(): Promise<TelegramSettingsResponseDto | null>;
    updateSettings(payload: TelegramSettingsDto): Promise<TelegramSettingsResponseDto>;
    getCurrentSession(): Promise<ConfirmTelegramSessionResponseDto | null>;
    startSession(payload: StartTelegramSessionDto): Promise<StartTelegramSessionResponseDto>;
    confirmSession(payload: ConfirmTelegramSessionDto): Promise<ConfirmTelegramSessionResponseDto>;
}
