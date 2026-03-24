import { Module } from '@nestjs/common';
import { TgmbasePrismaModule } from '../tgmbase-prisma/tgmbase-prisma.module.js';
import { TelegramDlMatchController } from './telegram-dl-match.controller.js';
import { TelegramDlMatchExporter } from './telegram-dl-match.exporter.js';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';

@Module({
  imports: [TgmbasePrismaModule],
  controllers: [TelegramDlMatchController],
  providers: [TelegramDlMatchService, TelegramDlMatchExporter],
  exports: [TelegramDlMatchService],
})
export class TelegramDlMatchModule {}
