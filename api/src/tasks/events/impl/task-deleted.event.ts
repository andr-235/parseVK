export class TaskDeletedEvent {
  constructor(
    public readonly taskId: number,
    public readonly deletedAt: Date,
  ) {}
}
