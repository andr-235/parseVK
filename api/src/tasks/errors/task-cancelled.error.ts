export class TaskCancelledError extends Error {
  constructor(public readonly taskId: number) {
    super(`Task ${taskId} was cancelled`);
    this.name = 'TaskCancelledError';
  }
}
