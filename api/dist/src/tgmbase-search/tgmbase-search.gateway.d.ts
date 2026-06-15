import type { Socket } from 'socket.io';
export type TgmbaseSearchProgressStatus = 'started' | 'progress' | 'completed' | 'failed';
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
export declare class TgmbaseSearchGateway {
    private readonly logger;
    private readonly server;
    handleSubscribe(client: Socket, payload: {
        searchId?: string;
    } | undefined): void;
    broadcastProgress(payload: TgmbaseSearchProgressPayload): void;
}
