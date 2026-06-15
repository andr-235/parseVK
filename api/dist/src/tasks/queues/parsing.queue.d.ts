import { Queue } from 'bullmq';
import type { ParsingTaskJobData } from '../interfaces/parsing-task-job.interface.js';
export declare class ParsingQueueProducer {
    private readonly queue;
    constructor(queue: Queue<ParsingTaskJobData>);
    enqueue(data: ParsingTaskJobData): Promise<void>;
    remove(taskId: number): Promise<void>;
    getStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        total: number;
    }>;
    clear(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
}
