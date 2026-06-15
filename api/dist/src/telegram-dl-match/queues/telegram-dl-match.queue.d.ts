import { Queue } from 'bullmq';
import { type TelegramDlMatchJobData } from './telegram-dl-match.constants.js';
export declare class TelegramDlMatchQueueProducer {
    private readonly queue;
    constructor(queue: Queue<TelegramDlMatchJobData>);
    enqueue(data: TelegramDlMatchJobData): Promise<void>;
}
