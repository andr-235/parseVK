import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TelegramDlMatchService } from '../telegram-dl-match.service.js';
import { type TelegramDlMatchJobData } from './telegram-dl-match.constants.js';
export declare class TelegramDlMatchProcessor extends WorkerHost {
    private readonly service;
    private readonly logger;
    constructor(service: TelegramDlMatchService);
    process(job: Job<TelegramDlMatchJobData>): Promise<void>;
    onCompleted(job: Job<TelegramDlMatchJobData>): void;
    onFailed(job: Job<TelegramDlMatchJobData> | undefined, error: Error): void;
}
