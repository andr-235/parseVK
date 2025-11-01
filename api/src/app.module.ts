import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: undefined,
    }),
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
    VkModule,
    GroupsModule,
    KeywordsModule,
    TasksModule,
    CommentsModule,
    WatchlistModule,
    PhotoAnalysisModule,
    AuthorsModule,
    DataImportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
