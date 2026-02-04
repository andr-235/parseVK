import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { MetricsModule } from './metrics/metrics.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MonitoringModule } from './monitoring/monitoring.module.js';
import { ClickHouseModule } from './clickhouse/clickhouse.module.js';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module.js';
import { SyncModule } from './sync/sync.module.js';
import type { AppConfig } from './config/app.config.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    // BullMQ глобальная конфигурация
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
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
    ClickHouseModule,
    ElasticsearchModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService, LoggingInterceptor, HttpExceptionFilter],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
