import type { ParsingTaskJobData } from './interfaces/parsing-task-job.interface.js';
import { ParsingQueueProducer } from './queues/parsing.queue.js';
export declare class ParsingQueueService {
    private readonly producer;
    private readonly logger;
    constructor(producer: ParsingQueueProducer);
    enqueue(job: ParsingTaskJobData): Promise<void>;
    remove(taskId: number): Promise<void>;
    getStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        total: number;
    }>;
    pause(): Promise<void>;
    resume(): Promise<void>;
}
