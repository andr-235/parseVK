import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
export type OkFriendsStreamEventType = 'progress' | 'log' | 'done' | 'error';
export declare class OkFriendsJobStreamService {
    private readonly streams;
    getStream(jobId: string): Observable<MessageEvent>;
    emit(jobId: string, event: MessageEvent): void;
    complete(jobId: string): void;
    private getSubject;
}
