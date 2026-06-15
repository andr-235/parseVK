var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TgmbasePrismaModule } from '../tgmbase-prisma/tgmbase-prisma.module.js';
import { TelegramDlMatchController } from './telegram-dl-match.controller.js';
import { TelegramDlMatchExporter } from './telegram-dl-match.exporter.js';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';
import { TELEGRAM_DL_MATCH_QUEUE } from './queues/telegram-dl-match.constants.js';
import { TelegramDlMatchQueueProducer } from './queues/telegram-dl-match.queue.js';
import { TelegramDlMatchProcessor } from './queues/telegram-dl-match.processor.js';
let TelegramDlMatchModule = class TelegramDlMatchModule {
};
TelegramDlMatchModule = __decorate([
    Module({
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
], TelegramDlMatchModule);
export { TelegramDlMatchModule };
//# sourceMappingURL=telegram-dl-match.module.js.map