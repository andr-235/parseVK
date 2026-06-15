var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
import { TelegramIdentifierResolverService } from './services/telegram-identifier-resolver.service.js';
import { TelegramDiscussionResolverService } from './services/telegram-discussion-resolver.service.js';
import { TelegramCommentAuthorCollectorService } from './services/telegram-comment-author-collector.service.js';
let TelegramModule = class TelegramModule {
};
TelegramModule = __decorate([
    Module({
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
            TelegramIdentifierResolverService,
            TelegramDiscussionResolverService,
            TelegramCommentAuthorCollectorService,
            TelegramChatRepository,
            TelegramMemberRepository,
        ],
        exports: [TelegramService, TelegramAuthService],
    })
], TelegramModule);
export { TelegramModule };
//# sourceMappingURL=telegram.module.js.map