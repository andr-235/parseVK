import { MetricsService } from './metrics.service.js';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    getMetrics(): Promise<string>;
}
