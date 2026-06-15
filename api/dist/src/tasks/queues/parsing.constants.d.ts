export declare const PARSING_QUEUE = "parsing";
export declare const PARSING_CONCURRENCY = 2;
export declare const PARSING_RATE_LIMITER: {
    max: number;
    duration: number;
};
export declare const PARSING_RETRY_OPTIONS: {
    attempts: number;
    backoff: {
        type: "exponential";
        delay: number;
    };
};
export declare const PARSING_JOB_TIMEOUT: number;
export declare function resolveParsingJobTimeout(params: {
    mode: 'recent_posts' | 'recheck_group';
    groupsCount: number;
}): number;
