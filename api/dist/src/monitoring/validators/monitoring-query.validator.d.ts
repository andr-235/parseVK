export declare class MonitoringQueryValidator {
    parseKeywords(keywords?: string | string[]): string[] | undefined;
    parseFromDate(value?: string): Date | null;
    parseSources(sources?: string | string[]): string[] | undefined;
    normalizeLimit(limit: number): number;
    normalizePage(page: number): number;
    normalizeLimitWithDefault(limit?: number): number;
}
