var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PARSING_QUEUE, PARSING_RETRY_OPTIONS } from './parsing.constants.js';
let ParsingQueueProducer = class ParsingQueueProducer {
    queue;
    constructor(queue) {
        this.queue = queue;
    }
    async enqueue(data) {
        await this.queue.add('parse-task', data, {
            attempts: PARSING_RETRY_OPTIONS.attempts,
            backoff: PARSING_RETRY_OPTIONS.backoff,
            removeOnComplete: {
                age: 24 * 60 * 60,
                count: 100,
            },
            removeOnFail: {
                age: 7 * 24 * 60 * 60,
            },
        });
    }
    async remove(taskId) {
        const jobs = await this.queue.getJobs([
            'waiting',
            'active',
            'delayed',
            'paused',
        ]);
        for (const job of jobs) {
            if (job.data.taskId === taskId) {
                await job.remove();
            }
        }
    }
    async getStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
            this.queue.getDelayedCount(),
        ]);
        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        };
    }
    async clear() {
        await this.queue.drain();
    }
    async pause() {
        await this.queue.pause();
    }
    async resume() {
        await this.queue.resume();
    }
};
ParsingQueueProducer = __decorate([
    Injectable(),
    __param(0, InjectQueue(PARSING_QUEUE)),
    __metadata("design:paramtypes", [Queue])
], ParsingQueueProducer);
export { ParsingQueueProducer };
//# sourceMappingURL=parsing.queue.js.map