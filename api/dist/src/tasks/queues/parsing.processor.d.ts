import { WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { Job } from 'bullmq';
import { TasksGateway } from '../tasks.gateway.js';
import type { ParsingTaskJobData } from '../interfaces/parsing-task-job.interface.js';
import { TaskCancellationService } from '../task-cancellation.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import type { IParsingTaskRepository } from '../interfaces/parsing-task-repository.interface.js';
export declare class ParsingProcessor extends WorkerHost {
    private readonly commandBus;
    private readonly repository;
    private readonly tasksGateway;
    private readonly cancellationService;
    private readonly metricsService?;
    private readonly logger;
    constructor(commandBus: CommandBus, repository: IParsingTaskRepository, tasksGateway: TasksGateway, cancellationService: TaskCancellationService, metricsService?: MetricsService | undefined);
    process(job: Job<ParsingTaskJobData>): Promise<void>;
    onActive(job: Job<ParsingTaskJobData>): void;
    onCompleted(job: Job<ParsingTaskJobData>): void;
    onFailed(job: Job<ParsingTaskJobData> | undefined, error: Error): void;
    onError(error: Error): void;
    private markStatus;
}
