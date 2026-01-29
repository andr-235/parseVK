import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { VkModule } from '../vk/vk.module.js';
import { ParsingTaskRunner } from './parsing-task.runner.js';
import { ParsingQueueService } from './parsing-queue.service.js';
import { TasksGateway } from './tasks.gateway.js';
import { ParsingQueueProducer } from './queues/parsing.queue.js';
import { ParsingProcessor } from './queues/parsing.processor.js';
import { PARSING_QUEUE } from './queues/parsing.constants.js';
import { TaskCancellationService } from './task-cancellation.service.js';
import { CommonModule } from '../common/common.module.js';
import { TaskAutomationService } from './automation/task-automation.service.js';
import { TaskAutomationController } from './automation/task-automation.controller.js';
import { TaskMapper } from './mappers/task.mapper.js';
import { TaskDescriptionParser } from './parsers/task-description.parser.js';
import { TaskContextBuilder } from './builders/task-context.builder.js';
import { TasksRepository } from './repositories/tasks.repository.js';
import { ParsingTaskRepository } from './repositories/parsing-task.repository.js';
import { TaskAutomationRepository } from './repositories/task-automation.repository.js';

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
    {
      provide: 'ITasksRepository',
      useClass: TasksRepository,
    },
    {
      provide: 'IParsingTaskRepository',
      useClass: ParsingTaskRepository,
    },
    {
      provide: 'ITaskAutomationRepository',
      useClass: TaskAutomationRepository,
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
