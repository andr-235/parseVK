import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateParsingTaskDto } from './dto/create-parsing-task.dto';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface';
import type { TaskDetail, TaskSummary } from './interfaces/task.interface';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('parse')
  async createParsingTask(@Body() dto: CreateParsingTaskDto): Promise<ParsingTaskResult> {
    return this.tasksService.createParsingTask(dto);
  }

  @Get()
  async getTasks(): Promise<TaskSummary[]> {
    return this.tasksService.getTasks();
  }

  @Get(':taskId')
  async getTask(@Param('taskId', ParseIntPipe) taskId: number): Promise<TaskDetail> {
    return this.tasksService.getTask(taskId);
  }

  @Post(':taskId/resume')
  async resumeTask(@Param('taskId', ParseIntPipe) taskId: number): Promise<ParsingTaskResult> {
    return this.tasksService.resumeTask(taskId);
  }
}
