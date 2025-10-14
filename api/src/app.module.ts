import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './common/cache/cache.module';
import { VkModule } from './vk/vk.module';
import { GroupsModule } from './groups/groups.module';
import { KeywordsModule } from './keywords/keywords.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: undefined,
    }),
    CacheModule,
    VkModule,
    GroupsModule,
    KeywordsModule,
    TasksModule,
    CommentsModule,
    WatchlistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
