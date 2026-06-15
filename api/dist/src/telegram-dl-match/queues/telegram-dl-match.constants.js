export const TELEGRAM_DL_MATCH_QUEUE = 'telegram-dl-match';
export const TELEGRAM_DL_MATCH_JOB = 'process-run';
export const TELEGRAM_DL_MATCH_CONCURRENCY = 1;
export const TELEGRAM_DL_MATCH_RETRY_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 5000,
    },
};
//# sourceMappingURL=telegram-dl-match.constants.js.map