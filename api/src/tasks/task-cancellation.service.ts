import { Injectable } from '@nestjs/common';
import { TaskCancelledError } from './errors/task-cancelled.error';

@Injectable()
export class TaskCancellationService {
  private readonly cancelledTasks = new Set<number>();

  requestCancel(taskId: number): void {
    this.cancelledTasks.add(taskId);
  }

  clear(taskId: number): void {
    this.cancelledTasks.delete(taskId);
  }

  isCancelled(taskId: number): boolean {
    return this.cancelledTasks.has(taskId);
  }

  throwIfCancelled(taskId: number): void {
    if (this.isCancelled(taskId)) {
      throw new TaskCancelledError(taskId);
    }
  }
}

