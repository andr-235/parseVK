import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TgmbasePrismaModule } from '../tgmbase-prisma/tgmbase-prisma.module.js';
import { TelegramDlMatchController } from './telegram-dl-match.controller.js';
import { TelegramDlMatchExporter } from './telegram-dl-match.exporter.js';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';
import { TELEGRAM_DL_MATCH_QUEUE } from './queues/telegram-dl-match.constants.js';
import { TelegramDlMatchQueueProducer } from './queues/telegram-dl-match.queue.js';
import { TelegramDlMatchProcessor } from './queues/telegram-dl-match.processor.js';

@Module({
  imports: [
    TgmbasePrismaModule,
    BullModule.registerQueue({
      name: TELEGRAM_DL_MATCH_QUEUE,
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
        },
      },
    }),
  ],
  controllers: [TelegramDlMatchController],
  providers: [
    TelegramDlMatchService,
    TelegramDlMatchExporter,
    TelegramDlMatchQueueProducer,
    TelegramDlMatchProcessor,
  ],
  exports: [TelegramDlMatchService],
})
export class TelegramDlMatchModule {}
