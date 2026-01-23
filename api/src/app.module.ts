import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CacheModule } from './common/cache/cache.module';
import { CommonModule } from './common/common.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaModule } from './prisma.module';
import { VkModule } from './vk/vk.module';
import { VkFriendsModule } from './vk-friends/vk-friends.module';
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
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/auth.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import type { AppConfig } from './config/app.config';

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
  ],
  controllers: [AppController],
  providers: [AppService, LoggingInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
