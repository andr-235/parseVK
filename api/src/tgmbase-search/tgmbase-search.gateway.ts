import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

export type TgmbaseSearchProgressStatus =
  | 'started'
  | 'progress'
  | 'completed'
  | 'failed';

export interface TgmbaseSearchProgressPayload {
  searchId: string;
  status: TgmbaseSearchProgressStatus;
  processedQueries: number;
  totalQueries: number;
  currentBatch: number;
  totalBatches: number;
  batchSize: number;
  error?: string | null;
}

@WebSocketGateway({ namespace: 'tgmbase-search', cors: { origin: '*' } })
export class TgmbaseSearchGateway {
  private readonly logger = new Logger(TgmbaseSearchGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { searchId?: string } | undefined,
  ): void {
    const searchId = payload?.searchId?.trim();
    if (!searchId) {
      return;
    }

    client.join(searchId);
    this.logger.log(`tgmbase search subscription established: searchId=${searchId}`);
  }

  broadcastProgress(payload: TgmbaseSearchProgressPayload): void {
    if (!this.server) {
      return;
    }

    this.server.to(payload.searchId).emit('tgmbase-search-progress', payload);
    this.logger.debug(
      `tgmbase search progress emitted: searchId=${payload.searchId} status=${payload.status} processed=${payload.processedQueries}/${payload.totalQueries} batch=${payload.currentBatch}/${payload.totalBatches}`,
    );
  }
}
