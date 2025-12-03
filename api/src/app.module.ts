import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './common/cache/cache.module';
import { CommonModule } from './common/common.module';
import { VkModule } from './vk/vk.module';
import { GroupsModule } from './groups/groups.module';
import { KeywordsModule } from './keywords/keywords.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { PhotoAnalysisModule } from './photo-analysis/photo-analysis.module';
import { AuthorsModule } from './authors/authors.module';
import { DataImportModule } from './data-import/data-import.module';
import { ListingsModule } from './listings/listings.module';
import { TelegramModule } from './telegram/telegram.module';
import type { AppConfig } from './config/app.config';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 минута
        limit: 100, // 100 запросов в минуту
      },
    ]),
    // BullMQ глобальная конфигурация
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        connection: {
          host: configService.get('redisHost', { infer: true }) || 'redis',
          port: configService.get('redisPort', { infer: true }) || 6379,
        },
      }),
    }),
    CacheModule,
    CommonModule,
    VkModule,
    GroupsModule,
    KeywordsModule,
    TasksModule,
    CommentsModule,
    WatchlistModule,
    PhotoAnalysisModule,
    AuthorsModule,
    DataImportModule,
    ListingsModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
