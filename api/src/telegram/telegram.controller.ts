import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SyncTelegramChatDto } from './dto/sync-telegram-chat.dto';
import { TelegramSyncResultDto } from './dto/telegram-sync-result.dto';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('sync')
  async syncChat(@Body() payload: SyncTelegramChatDto): Promise<TelegramSyncResultDto> {
    return this.telegramService.syncChat({
      identifier: payload.identifier,
      limit: payload.limit,
    });
  }
}

