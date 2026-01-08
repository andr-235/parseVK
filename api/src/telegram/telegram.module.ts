import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramAuthController } from './telegram-auth.controller';
import { TelegramClientManagerService } from './services/telegram-client-manager.service';
import { TelegramChatMapper } from './mappers/telegram-chat.mapper';
import { TelegramMemberMapper } from './mappers/telegram-member.mapper';
import { TelegramParticipantCollectorService } from './services/telegram-participant-collector.service';
import { TelegramChatSyncService } from './services/telegram-chat-sync.service';
import { TelegramExcelExporterService } from './services/telegram-excel-exporter.service';
import { TelegramChatRepository } from './repositories/telegram-chat.repository';
import { TelegramMemberRepository } from './repositories/telegram-member.repository';

@Module({
  controllers: [TelegramController, TelegramAuthController],
  providers: [
    TelegramService,
    TelegramAuthService,
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
