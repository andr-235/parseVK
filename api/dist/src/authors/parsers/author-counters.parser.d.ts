import type { ParsedCounters } from './counters-extractor.js';
export declare class AuthorCountersParser {
    private static readonly countersExtractor;
    private static readonly lastSeenParser;
    static extractCounters(value: unknown): ParsedCounters;
    static extractLastSeenAt(value: unknown): string | null;
}
