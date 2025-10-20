import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';
import { ParsingTaskRunner } from './parsing-task.runner';
import { ParsingQueueService } from './parsing-queue.service';
import { TasksGateway } from './tasks.gateway';
import { ParsingQueueProducer } from './queues/parsing.queue';
import { ParsingProcessor } from './queues/parsing.processor';
import {
  PARSING_QUEUE,
  PARSING_RATE_LIMITER,
} from './queues/parsing.constants';
import { TaskCancellationService } from './task-cancellation.service';
import { CommonModule } from '../common/common.module';
import { TaskAutomationService } from './automation/task-automation.service';
import { TaskAutomationController } from './automation/task-automation.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    VkModule,
    CommonModule,
    BullModule.registerQueue({
      name: PARSING_QUEUE,
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 60 * 60, // 24 часа
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60, // 7 дней
        },
      },
    }),
  ],
  controllers: [TasksController, TaskAutomationController],
  providers: [
    TasksService,
    PrismaService,
    ParsingTaskRunner,
    ParsingQueueService,
    TasksGateway,
    ParsingQueueProducer,
    ParsingProcessor,
    TaskCancellationService,
    TaskAutomationService,
  ],
  exports: [ParsingQueueService],
})
export class TasksModule {}
