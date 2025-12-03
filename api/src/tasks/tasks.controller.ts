import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateParsingTaskDto } from './dto/create-parsing-task.dto';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface';
import type { TaskDetail, TaskSummary } from './interfaces/task.interface';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('parse')
  async createParsingTask(
    @Body() dto: CreateParsingTaskDto,
  ): Promise<ParsingTaskResult> {
    return this.tasksService.createParsingTask(dto);
  }

  @Get()
  async getTasks(
    @Query() query: GetTasksQueryDto,
  ): Promise<{ tasks: TaskSummary[]; total: number; page: number; limit: number }> {
    return this.tasksService.getTasks({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':taskId')
  async getTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<TaskDetail> {
    return this.tasksService.getTask(taskId);
  }

  @Post(':taskId/resume')
  async resumeTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<ParsingTaskResult> {
    return this.tasksService.resumeTask(taskId);
  }

  @Post(':taskId/check')
  async refreshTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<ParsingTaskResult> {
    return this.tasksService.refreshTask(taskId);
  }

  @Delete(':taskId')
  async deleteTask(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<void> {
    await this.tasksService.deleteTask(taskId);
  }
}
