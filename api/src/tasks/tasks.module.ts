import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma.service';
import { VkModule } from '../vk/vk.module';
import { ParsingTaskRunner } from './parsing-task.runner';
import { ParsingQueueService } from './parsing-queue.service';
import { TasksGateway } from './tasks.gateway';
import { ParsingQueueProducer } from './queues/parsing.queue';
import { ParsingProcessor } from './queues/parsing.processor';
import { PARSING_QUEUE } from './queues/parsing.constants';
import { TaskCancellationService } from './task-cancellation.service';
import { CommonModule } from '../common/common.module';
import { TaskAutomationService } from './automation/task-automation.service';
import { TaskAutomationController } from './automation/task-automation.controller';
import { TaskMapper } from './mappers/task.mapper';
import { TaskDescriptionParser } from './parsers/task-description.parser';
import { TaskContextBuilder } from './builders/task-context.builder';
import { TasksRepository } from './repositories/tasks.repository';

@Module({
  imports: [
    VkModule,
    CommonModule,
    BullModule.registerQueue({
      name: PARSING_QUEUE,
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
        },
      },
    }),
  ],
  controllers: [TasksController, TaskAutomationController],
  providers: [
    TasksService,
    PrismaService,
    {
      provide: 'ITasksRepository',
      useClass: TasksRepository,
    },
    ParsingTaskRunner,
    ParsingQueueService,
    TasksGateway,
    ParsingQueueProducer,
    ParsingProcessor,
    TaskCancellationService,
    TaskAutomationService,
    TaskMapper,
    TaskDescriptionParser,
    TaskContextBuilder,
  ],
  exports: [ParsingQueueService],
})
export class TasksModule {}
