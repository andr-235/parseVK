import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import {
  StartTelegramSessionDto,
  StartTelegramSessionResponseDto,
} from './dto/start-session.dto';
import {
  ConfirmTelegramSessionDto,
  ConfirmTelegramSessionResponseDto,
} from './dto/confirm-session.dto';
import {
  TelegramSettingsDto,
  TelegramSettingsResponseDto,
} from './dto/telegram-settings.dto';

@Controller('telegram')
export class TelegramAuthController {
  constructor(private readonly telegramAuthService: TelegramAuthService) {}

  @Get('settings')
  getSettings(): Promise<TelegramSettingsResponseDto | null> {
    return this.telegramAuthService.getSettings();
  }

  @Patch('settings')
  updateSettings(
    @Body() payload: TelegramSettingsDto,
  ): Promise<TelegramSettingsResponseDto> {
    return this.telegramAuthService.updateSettings(payload);
  }

  @Get('session')
  getCurrentSession() {
    return this.telegramAuthService.getCurrentSession();
  }

  @Post('session/start')
  startSession(
    @Body() payload: StartTelegramSessionDto,
  ): Promise<StartTelegramSessionResponseDto> {
    return this.telegramAuthService.startSession(payload);
  }

  @Post('session/confirm')
  confirmSession(
    @Body() payload: ConfirmTelegramSessionDto,
  ): Promise<ConfirmTelegramSessionResponseDto> {
    return this.telegramAuthService.confirmSession(payload);
  }
}

