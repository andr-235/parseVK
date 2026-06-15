export declare const TELEGRAM_DL_MATCH_QUEUE = "telegram-dl-match";
export declare const TELEGRAM_DL_MATCH_JOB = "process-run";
export declare const TELEGRAM_DL_MATCH_CONCURRENCY = 1;
export declare const TELEGRAM_DL_MATCH_RETRY_OPTIONS: {
    attempts: number;
    backoff: {
        type: "exponential";
        delay: number;
    };
};
export interface TelegramDlMatchJobData {
    runId: string;
}
