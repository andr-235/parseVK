import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { MetricsService } from '../../metrics/metrics.service.js';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly metricsService?;
    private readonly logger;
    private readonly isProduction;
    private static readonly silentPaths;
    constructor(metricsService?: MetricsService | undefined);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private createLogEntry;
    private logRequest;
    private logResponse;
    private logError;
    private shouldSkipSuccessLogs;
}
