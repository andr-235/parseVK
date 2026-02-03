export class TaskStartedEvent {
  constructor(
    public readonly taskId: number,
    public readonly startedAt: Date,
  ) {}
}
