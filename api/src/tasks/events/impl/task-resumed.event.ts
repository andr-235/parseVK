export class TaskResumedEvent {
  constructor(
    public readonly taskId: number,
    public readonly resumedAt: Date,
  ) {}
}
