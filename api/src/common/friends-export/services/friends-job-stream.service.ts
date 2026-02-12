import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { FriendsStreamEventType } from '../interfaces/friends-export.interfaces.js';

/**
 * Shared SSE-стрим сервис для экспорта друзей.
 *
 * Используется обоими модулями (vk-friends, ok-friends).
 * Управляет Subject-ами по jobId, отдаёт Observable для SSE.
 */
@Injectable()
export class FriendsJobStreamService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  getStream(jobId: string): Observable<MessageEvent> {
    return this.getSubject(jobId).asObservable();
  }

  emit(jobId: string, event: MessageEvent): void {
    this.getSubject(jobId).next(event);
  }

  complete(jobId: string): void {
    const subject = this.streams.get(jobId);
    if (!subject) {
      return;
    }

    subject.complete();
    this.streams.delete(jobId);
  }

  private getSubject(jobId: string): Subject<MessageEvent> {
    const existing = this.streams.get(jobId);
    if (existing) {
      return existing;
    }

    const created = new Subject<MessageEvent>();
    this.streams.set(jobId, created);
    return created;
  }
}

// Re-export type for consumers that need the event type
export type { FriendsStreamEventType };
