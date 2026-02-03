export class TaskCreatedEvent {
  constructor(
    public readonly taskId: number,
    public readonly scope: string,
    public readonly groupIds: number[],
    public readonly postLimit: number,
    public readonly createdAt: Date,
  ) {}
}
