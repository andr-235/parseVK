var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { TasksController } from './tasks.controller.js';
import { VkModule } from '../vk/vk.module.js';
import { TaskGroupResolverService } from './services/task-group-resolver.service.js';
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
import { TaskAuditLogRepository } from './repositories/task-audit-log.repository.js';
import { CreateParsingTaskHandler } from './commands/handlers/create-parsing-task.handler.js';
import { ExecuteParsingTaskHandler } from './commands/handlers/execute-parsing-task.handler.js';
import { ResumeTaskHandler } from './commands/handlers/resume-task.handler.js';
import { DeleteTaskHandler } from './commands/handlers/delete-task.handler.js';
import { RefreshTaskHandler } from './commands/handlers/refresh-task.handler.js';
import { ProcessGroupHandler } from './commands/handlers/process-group.handler.js';
import { SavePostHandler } from './commands/handlers/save-post.handler.js';
import { SaveCommentsHandler } from './commands/handlers/save-comments.handler.js';
import { SaveAuthorsHandler } from './commands/handlers/save-authors.handler.js';
import { UpdateTaskProgressHandler } from './commands/handlers/update-task-progress.handler.js';
import { GetTasksHandler } from './queries/handlers/get-tasks.handler.js';
import { GetTaskByIdHandler } from './queries/handlers/get-task-by-id.handler.js';
import { GetTaskAuditLogHandler } from './queries/handlers/get-task-audit-log.handler.js';
import { GetTaskStatisticsHandler } from './queries/handlers/get-task-statistics.handler.js';
import { TaskAuditLogHandler } from './events/handlers/task-audit-log.handler.js';
import { TaskWebSocketNotificationHandler } from './events/handlers/task-websocket-notification.handler.js';
const CommandHandlers = [
    CreateParsingTaskHandler,
    ExecuteParsingTaskHandler,
    ResumeTaskHandler,
    DeleteTaskHandler,
    RefreshTaskHandler,
    ProcessGroupHandler,
    SavePostHandler,
    SaveCommentsHandler,
    SaveAuthorsHandler,
    UpdateTaskProgressHandler,
];
const QueryHandlers = [
    GetTasksHandler,
    GetTaskByIdHandler,
    GetTaskAuditLogHandler,
    GetTaskStatisticsHandler,
];
const EventHandlers = [TaskAuditLogHandler, TaskWebSocketNotificationHandler];
let TasksModule = class TasksModule {
};
TasksModule = __decorate([
    Module({
        imports: [
            CqrsModule,
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
            ...CommandHandlers,
            ...QueryHandlers,
            ...EventHandlers,
            ParsingQueueService,
            TasksGateway,
            TaskCancellationService,
            TaskAutomationService,
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
            TaskAuditLogRepository,
            TaskMapper,
            TaskDescriptionParser,
            TaskContextBuilder,
            ParsingQueueProducer,
            ParsingProcessor,
            TaskGroupResolverService,
        ],
        exports: [ParsingQueueService],
    })
], TasksModule);
export { TasksModule };
//# sourceMappingURL=tasks.module.js.map