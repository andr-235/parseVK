export const PARSING_QUEUE = 'parsing';
export const PARSING_CONCURRENCY = 2;
export const PARSING_RATE_LIMITER = {
    max: 3,
    duration: 5000,
};
export const PARSING_RETRY_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 5000,
    },
};
export const PARSING_JOB_TIMEOUT = 30 * 60 * 1000;
const RECENT_POSTS_TIMEOUT_PER_GROUP_MS = 3 * 60 * 1000;
const RECHECK_GROUP_TIMEOUT_PER_GROUP_MS = 30 * 60 * 1000;
export function resolveParsingJobTimeout(params) {
    const groupsCount = Math.max(1, params.groupsCount);
    const perGroupTimeoutMs = params.mode === 'recheck_group'
        ? RECHECK_GROUP_TIMEOUT_PER_GROUP_MS
        : RECENT_POSTS_TIMEOUT_PER_GROUP_MS;
    return Math.max(PARSING_JOB_TIMEOUT, groupsCount * perGroupTimeoutMs);
}
//# sourceMappingURL=parsing.constants.js.map