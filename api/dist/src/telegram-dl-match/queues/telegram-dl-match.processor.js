var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramDlMatchProcessor_1;
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TelegramDlMatchService } from '../telegram-dl-match.service.js';
import { TELEGRAM_DL_MATCH_CONCURRENCY, TELEGRAM_DL_MATCH_QUEUE, } from './telegram-dl-match.constants.js';
let TelegramDlMatchProcessor = TelegramDlMatchProcessor_1 = class TelegramDlMatchProcessor extends WorkerHost {
    service;
    logger = new Logger(TelegramDlMatchProcessor_1.name);
    constructor(service) {
        super();
        this.service = service;
    }
    async process(job) {
        this.logger.log(`Запуск worker DL match: jobId=${String(job.id)} runId=${job.data.runId}`);
        await this.service.processRun(job.data.runId);
    }
    onCompleted(job) {
        this.logger.log(`DL match job завершен: jobId=${String(job.id)} runId=${job.data.runId}`);
    }
    onFailed(job, error) {
        if (!job) {
            this.logger.error(`DL match job failed without payload: ${error.message}`);
            return;
        }
        this.logger.error(`DL match job failed: jobId=${String(job.id)} runId=${job.data.runId} error=${error.message}`, error.stack);
    }
};
__decorate([
    OnWorkerEvent('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Job]),
    __metadata("design:returntype", void 0)
], TelegramDlMatchProcessor.prototype, "onCompleted", null);
__decorate([
    OnWorkerEvent('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Error]),
    __metadata("design:returntype", void 0)
], TelegramDlMatchProcessor.prototype, "onFailed", null);
TelegramDlMatchProcessor = TelegramDlMatchProcessor_1 = __decorate([
    Processor(TELEGRAM_DL_MATCH_QUEUE, {
        concurrency: TELEGRAM_DL_MATCH_CONCURRENCY,
    }),
    __metadata("design:paramtypes", [TelegramDlMatchService])
], TelegramDlMatchProcessor);
export { TelegramDlMatchProcessor };
//# sourceMappingURL=telegram-dl-match.processor.js.map