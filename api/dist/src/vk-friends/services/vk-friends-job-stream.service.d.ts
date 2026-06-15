import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
export type VkFriendsStreamEventType = 'progress' | 'log' | 'done' | 'error';
export declare class VkFriendsJobStreamService {
    private readonly streams;
    getStream(jobId: string): Observable<MessageEvent>;
    emit(jobId: string, event: MessageEvent): void;
    complete(jobId: string): void;
    private getSubject;
}
