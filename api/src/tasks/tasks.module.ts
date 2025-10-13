import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';
import { ParsingTaskRunner } from './parsing-task.runner';
import { ParsingQueueService } from './parsing-queue.service';
import { AuthorActivityService } from '../common/services/author-activity.service';

@Module({
  imports: [
    VkModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, PrismaService, ParsingTaskRunner, ParsingQueueService, AuthorActivityService],
})
export class TasksModule {}
