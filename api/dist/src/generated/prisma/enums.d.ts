export declare const CommentSource: {
    readonly TASK: "TASK";
    readonly WATCHLIST: "WATCHLIST";
};
export type CommentSource = (typeof CommentSource)[keyof typeof CommentSource];
export declare const WatchlistStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly PAUSED: "PAUSED";
    readonly STOPPED: "STOPPED";
};
export type WatchlistStatus = (typeof WatchlistStatus)[keyof typeof WatchlistStatus];
export declare const TelegramChatType: {
    readonly PRIVATE: "PRIVATE";
    readonly GROUP: "GROUP";
    readonly SUPERGROUP: "SUPERGROUP";
    readonly CHANNEL: "CHANNEL";
};
export type TelegramChatType = (typeof TelegramChatType)[keyof typeof TelegramChatType];
export declare const TelegramMemberStatus: {
    readonly CREATOR: "CREATOR";
    readonly ADMINISTRATOR: "ADMINISTRATOR";
    readonly MEMBER: "MEMBER";
    readonly RESTRICTED: "RESTRICTED";
    readonly LEFT: "LEFT";
    readonly KICKED: "KICKED";
};
export type TelegramMemberStatus = (typeof TelegramMemberStatus)[keyof typeof TelegramMemberStatus];
export declare const SuspicionLevel: {
    readonly NONE: "NONE";
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
};
export type SuspicionLevel = (typeof SuspicionLevel)[keyof typeof SuspicionLevel];
export declare const MatchSource: {
    readonly COMMENT: "COMMENT";
    readonly POST: "POST";
};
export type MatchSource = (typeof MatchSource)[keyof typeof MatchSource];
export declare const KeywordFormSource: {
    readonly generated: "generated";
    readonly manual: "manual";
};
export type KeywordFormSource = (typeof KeywordFormSource)[keyof typeof KeywordFormSource];
export declare const UserRole: {
    readonly admin: "admin";
    readonly user: "user";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const MonitoringMessenger: {
    readonly whatsapp: "whatsapp";
    readonly max: "max";
};
export type MonitoringMessenger = (typeof MonitoringMessenger)[keyof typeof MonitoringMessenger];
export declare const ExportJobStatus: {
    readonly PENDING: "PENDING";
    readonly RUNNING: "RUNNING";
    readonly DONE: "DONE";
    readonly FAILED: "FAILED";
};
export type ExportJobStatus = (typeof ExportJobStatus)[keyof typeof ExportJobStatus];
export declare const JobLogLevel: {
    readonly info: "info";
    readonly warn: "warn";
    readonly error: "error";
};
export type JobLogLevel = (typeof JobLogLevel)[keyof typeof JobLogLevel];
