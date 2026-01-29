import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller.js';
import { TelegramService } from './telegram.service.js';
import { TelegramAuthService } from './telegram-auth.service.js';
import { TelegramAuthController } from './telegram-auth.controller.js';
import { TelegramClientManagerService } from './services/telegram-client-manager.service.js';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper.js';
import { TelegramMemberMapper } from './mappers/telegram-member.mapper.js';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service.js';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service.js';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service.js';
import { TelegramChatRepository } from './repositories/telegram-chat.repository.js';
import { TelegramMemberRepository } from './repositories/telegram-member.repository.js';
import { TelegramAuthRepository } from './repositories/telegram-auth.repository.js';

@Module({
  controllers: [TelegramController, TelegramAuthController],
  providers: [
    TelegramService,
    TelegramAuthService,
    {
      provide: 'ITelegramAuthRepository',
      useClass: TelegramAuthRepository,
    },
    TelegramClientManagerService,
    TelegramChatMapper,
    TelegramMemberMapper,
    TelegramParticipantCollectorService,
    TelegramChatSyncService,
    TelegramExcelExporterService,
    TelegramChatRepository,
    TelegramMemberRepository,
  ],
  exports: [TelegramService, TelegramAuthService],
})
export class TelegramModule {}
