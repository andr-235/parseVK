var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
let FriendsJobStreamService = class FriendsJobStreamService {
    streams = new Map();
    getStream(jobId) {
        return this.getSubject(jobId).asObservable();
    }
    emit(jobId, event) {
        this.getSubject(jobId).next(event);
    }
    complete(jobId) {
        const subject = this.streams.get(jobId);
        if (!subject) {
            return;
        }
        subject.complete();
        this.streams.delete(jobId);
    }
    getSubject(jobId) {
        const existing = this.streams.get(jobId);
        if (existing) {
            return existing;
        }
        const created = new Subject();
        this.streams.set(jobId, created);
        return created;
    }
};
FriendsJobStreamService = __decorate([
    Injectable()
], FriendsJobStreamService);
export { FriendsJobStreamService };
//# sourceMappingURL=friends-job-stream.service.js.map