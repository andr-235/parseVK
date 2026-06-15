var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from './config/config.module.js';
import { CacheModule } from './common/cache/cache.module.js';
import { CommonModule } from './common/common.module.js';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { PrismaModule } from './prisma.module.js';
import { TgmbasePrismaModule } from './tgmbase-prisma/tgmbase-prisma.module.js';
import { TgmbaseSearchModule } from './tgmbase-search/tgmbase-search.module.js';
import { VkModule } from './vk/vk.module.js';
import { VkFriendsModule } from './vk-friends/vk-friends.module.js';
import { OkFriendsModule } from './ok-friends/ok-friends.module.js';
import { GroupsModule } from './groups/groups.module.js';
import { KeywordsModule } from './keywords/keywords.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { WatchlistModule } from './watchlist/watchlist.module.js';
import { PhotoAnalysisModule } from './photo-analysis/photo-analysis.module.js';
import { AuthorsModule } from './authors/authors.module.js';
import { DataImportModule } from './data-import/data-import.module.js';
import { ListingsModule } from './listings/listings.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { TelegramDlImportModule } from './telegram-dl-import/telegram-dl-import.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MonitoringModule } from './monitoring/monitoring.module.js';
import { TelegramDlMatchModule } from './telegram-dl-match/telegram-dl-match.module.js';
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    }
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule,
            PrismaModule,
            TgmbasePrismaModule,
            TgmbaseSearchModule,
            ScheduleModule.forRoot(),
            BullModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('bullMqHost', { infer: true }) ?? 'redis',
                        port: configService.get('bullMqPort', { infer: true }) ?? 6379,
                    },
                    prefix: configService.get('bullMqPrefix', { infer: true }) ?? undefined,
                }),
            }),
            CacheModule,
            CommonModule,
            AuthModule,
            MetricsModule,
            VkModule,
            VkFriendsModule,
            OkFriendsModule,
            GroupsModule,
            KeywordsModule,
            TasksModule,
            CommentsModule,
            MonitoringModule,
            WatchlistModule,
            PhotoAnalysisModule,
            AuthorsModule,
            DataImportModule,
            ListingsModule,
            TelegramModule,
            TelegramDlImportModule,
            TelegramDlMatchModule,
        ],
        controllers: [AppController],
        providers: [AppService, LoggingInterceptor, HttpExceptionFilter],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map