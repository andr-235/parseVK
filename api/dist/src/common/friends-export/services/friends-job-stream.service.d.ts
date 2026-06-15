import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { FriendsStreamEventType } from '../interfaces/friends-export.interfaces.js';
export declare class FriendsJobStreamService {
    private readonly streams;
    getStream(jobId: string): Observable<MessageEvent>;
    emit(jobId: string, event: MessageEvent): void;
    complete(jobId: string): void;
    private getSubject;
}
export type { FriendsStreamEventType };
