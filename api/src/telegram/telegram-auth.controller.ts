import { Body, Controller, Post } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import {
  StartTelegramSessionDto,
  StartTelegramSessionResponseDto,
} from './dto/start-session.dto';
import {
  ConfirmTelegramSessionDto,
  ConfirmTelegramSessionResponseDto,
} from './dto/confirm-session.dto';

@Controller('telegram/session')
export class TelegramAuthController {
  constructor(private readonly telegramAuthService: TelegramAuthService) {}

  @Post('start')
  startSession(
    @Body() payload: StartTelegramSessionDto,
  ): Promise<StartTelegramSessionResponseDto> {
    return this.telegramAuthService.startSession(payload);
  }

  @Post('confirm')
  confirmSession(
    @Body() payload: ConfirmTelegramSessionDto,
  ): Promise<ConfirmTelegramSessionResponseDto> {
    return this.telegramAuthService.confirmSession(payload);
  }
}

