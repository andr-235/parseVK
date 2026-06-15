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
import { TELEGRAM_DL_MATCH_JOB, TELEGRAM_DL_MATCH_QUEUE, TELEGRAM_DL_MATCH_RETRY_OPTIONS, } from './telegram-dl-match.constants.js';
let TelegramDlMatchQueueProducer = class TelegramDlMatchQueueProducer {
    queue;
    constructor(queue) {
        this.queue = queue;
    }
    async enqueue(data) {
        await this.queue.add(TELEGRAM_DL_MATCH_JOB, data, {
            attempts: TELEGRAM_DL_MATCH_RETRY_OPTIONS.attempts,
            backoff: TELEGRAM_DL_MATCH_RETRY_OPTIONS.backoff,
            removeOnComplete: {
                age: 24 * 60 * 60,
                count: 100,
            },
            removeOnFail: {
                age: 7 * 24 * 60 * 60,
            },
        });
    }
};
TelegramDlMatchQueueProducer = __decorate([
    Injectable(),
    __param(0, InjectQueue(TELEGRAM_DL_MATCH_QUEUE)),
    __metadata("design:paramtypes", [Queue])
], TelegramDlMatchQueueProducer);
export { TelegramDlMatchQueueProducer };
//# sourceMappingURL=telegram-dl-match.queue.js.map