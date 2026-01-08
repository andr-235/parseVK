import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CacheModule } from './common/cache/cache.module';
import { CommonModule } from './common/common.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
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
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    // BullMQ глобальная конфигурация
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    CacheModule,
    CommonModule,
    AuthModule,
    MetricsModule,
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
  providers: [AppService, LoggingInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
