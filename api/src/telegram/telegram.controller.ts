import { Body, Controller, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SyncTelegramChatDto } from './dto/sync-telegram-chat.dto';
import { TelegramSyncResultDto } from './dto/telegram-sync-result.dto';
import type { Response } from 'express';

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

  @Get('export/:chatId')
  async exportChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.telegramService.exportChatToExcel(chatId);
    const chat = await this.telegramService.getChatInfo(chatId);
    const filename = `telegram_${chat.telegramId}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

