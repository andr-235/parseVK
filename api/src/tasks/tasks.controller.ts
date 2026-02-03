import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateParsingTaskDto } from './dto/create-parsing-task.dto.js';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto.js';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface.js';
import type { TaskDetail, TaskSummary } from './interfaces/task.interface.js';
import type { TaskAuditLog } from './interfaces/task-audit-log.interface.js';
import {
  CreateParsingTaskCommand,
  ResumeTaskCommand,
  DeleteTaskCommand,
  RefreshTaskCommand,
} from './commands/index.js';
import {
  GetTasksQuery,
  GetTaskByIdQuery,
  GetTaskAuditLogQuery,
} from './queries/index.js';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('parse')
  async createParsingTask(
    @Body() dto: CreateParsingTaskDto,
  ): Promise<ParsingTaskResult> {
    return this.commandBus.execute(
      new CreateParsingTaskCommand(dto.scope, dto.groupIds, dto.postLimit),
    );
  }

  @Get()
  async getTasks(@Query() query: GetTasksQueryDto): Promise<{
    tasks: TaskSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    return this.queryBus.execute(new GetTasksQuery(query.page, query.limit));
  }

  @Get(':taskId')
  async getTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<TaskDetail> {
    return this.queryBus.execute(new GetTaskByIdQuery(taskId));
  }

  @Get(':taskId/audit-log')
  async getTaskAuditLog(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<TaskAuditLog[]> {
    return this.queryBus.execute(new GetTaskAuditLogQuery(taskId));
  }

  @Post(':taskId/resume')
  async resumeTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<ParsingTaskResult> {
    return this.commandBus.execute(new ResumeTaskCommand(taskId));
  }

  @Post(':taskId/check')
  async refreshTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<ParsingTaskResult> {
    return this.commandBus.execute(new RefreshTaskCommand(taskId));
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteTaskCommand(taskId));
  }
}
