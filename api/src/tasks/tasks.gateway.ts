import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { ParsingScope } from './dto/create-parsing-task.dto';
import type { ParsingStats } from './interfaces/parsing-stats.interface';

export type GatewayTaskStatus = 'pending' | 'running' | 'done' | 'failed';

export interface TaskGatewayPayload {
  id: number;
  status?: GatewayTaskStatus;
  completed?: boolean;
  totalItems?: number | null;
  processedItems?: number | null;
  progress?: number | null;
  stats?: ParsingStats | null;
  scope?: ParsingScope | null;
  groupIds?: number[] | null;
  postLimit?: number | null;
  skippedGroupsMessage?: string | null;
  description?: string | null;
  error?: string | null;
  title?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
}

@WebSocketGateway({ namespace: 'tasks', cors: { origin: '*' } })
export class TasksGateway {
  @WebSocketServer()
  private readonly server!: Server;

  broadcastProgress(payload: TaskGatewayPayload): void {
    this.emit('task-progress', payload);
  }

  broadcastStatus(payload: TaskGatewayPayload): void {
    this.emit('task-status', payload);
  }

  private emit(event: string, payload: TaskGatewayPayload): void {
    const enriched: TaskGatewayPayload = {
      ...payload,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    };

    if (this.server) {
      this.server.emit(event, enriched);
    }
  }
}
