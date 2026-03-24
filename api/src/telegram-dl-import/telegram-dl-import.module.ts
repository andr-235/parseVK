import { Module } from '@nestjs/common';
import { TelegramDlImportController } from './telegram-dl-import.controller.js';
import { TelegramDlImportParser } from './telegram-dl-import.parser.js';
import { TelegramDlImportService } from './telegram-dl-import.service.js';

@Module({
  controllers: [TelegramDlImportController],
  providers: [TelegramDlImportService, TelegramDlImportParser],
  exports: [TelegramDlImportService],
})
export class TelegramDlImportModule {}
