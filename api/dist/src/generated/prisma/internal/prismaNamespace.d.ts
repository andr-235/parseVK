import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../models.js";
import { type PrismaClient } from "./class.js";
export type * from '../models.js';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
export declare const prismaVersion: PrismaVersion;
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: runtime.DbNullClass;
export declare const JsonNull: runtime.JsonNullClass;
export declare const AnyNull: runtime.AnyNullClass;
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export type XOR<T, U> = T extends object ? U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U : T;
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
export declare const ModelName: {
    readonly Task: "Task";
    readonly TaskAuditLog: "TaskAuditLog";
    readonly ExportJob: "ExportJob";
    readonly FriendRecord: "FriendRecord";
    readonly JobLog: "JobLog";
    readonly User: "User";
    readonly TaskAutomationSettings: "TaskAutomationSettings";
    readonly Group: "Group";
    readonly Post: "Post";
    readonly Comment: "Comment";
    readonly Listing: "Listing";
    readonly Author: "Author";
    readonly PhotoAnalysis: "PhotoAnalysis";
    readonly Keyword: "Keyword";
    readonly KeywordForm: "KeywordForm";
    readonly KeywordFormExclusion: "KeywordFormExclusion";
    readonly MonitoringGroup: "MonitoringGroup";
    readonly CommentKeywordMatch: "CommentKeywordMatch";
    readonly WatchlistSettings: "WatchlistSettings";
    readonly WatchlistAuthor: "WatchlistAuthor";
    readonly TelegramChat: "TelegramChat";
    readonly TelegramUser: "TelegramUser";
    readonly TelegramChatMember: "TelegramChatMember";
    readonly TelegramSession: "TelegramSession";
    readonly TelegramSettings: "TelegramSettings";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "task" | "taskAuditLog" | "exportJob" | "friendRecord" | "jobLog" | "user" | "taskAutomationSettings" | "group" | "post" | "comment" | "listing" | "author" | "photoAnalysis" | "keyword" | "keywordForm" | "keywordFormExclusion" | "monitoringGroup" | "commentKeywordMatch" | "watchlistSettings" | "watchlistAuthor" | "telegramChat" | "telegramUser" | "telegramChatMember" | "telegramSession" | "telegramSettings";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        Task: {
            payload: Prisma.$TaskPayload<ExtArgs>;
            fields: Prisma.TaskFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TaskFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TaskFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>;
                };
                findFirst: {
                    args: Prisma.TaskFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TaskFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>;
                };
                findMany: {
                    args: Prisma.TaskFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>[];
                };
                create: {
                    args: Prisma.TaskCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>;
                };
                createMany: {
                    args: Prisma.TaskCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TaskCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>[];
                };
                delete: {
                    args: Prisma.TaskDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>;
                };
                update: {
                    args: Prisma.TaskUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>;
                };
                deleteMany: {
                    args: Prisma.TaskDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TaskUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TaskUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>[];
                };
                upsert: {
                    args: Prisma.TaskUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskPayload>;
                };
                aggregate: {
                    args: Prisma.TaskAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTask>;
                };
                groupBy: {
                    args: Prisma.TaskGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TaskGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TaskCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TaskCountAggregateOutputType> | number;
                };
            };
        };
        TaskAuditLog: {
            payload: Prisma.$TaskAuditLogPayload<ExtArgs>;
            fields: Prisma.TaskAuditLogFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TaskAuditLogFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TaskAuditLogFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>;
                };
                findFirst: {
                    args: Prisma.TaskAuditLogFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TaskAuditLogFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>;
                };
                findMany: {
                    args: Prisma.TaskAuditLogFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>[];
                };
                create: {
                    args: Prisma.TaskAuditLogCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>;
                };
                createMany: {
                    args: Prisma.TaskAuditLogCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TaskAuditLogCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>[];
                };
                delete: {
                    args: Prisma.TaskAuditLogDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>;
                };
                update: {
                    args: Prisma.TaskAuditLogUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>;
                };
                deleteMany: {
                    args: Prisma.TaskAuditLogDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TaskAuditLogUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TaskAuditLogUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>[];
                };
                upsert: {
                    args: Prisma.TaskAuditLogUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAuditLogPayload>;
                };
                aggregate: {
                    args: Prisma.TaskAuditLogAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTaskAuditLog>;
                };
                groupBy: {
                    args: Prisma.TaskAuditLogGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TaskAuditLogGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TaskAuditLogCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TaskAuditLogCountAggregateOutputType> | number;
                };
            };
        };
        ExportJob: {
            payload: Prisma.$ExportJobPayload<ExtArgs>;
            fields: Prisma.ExportJobFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ExportJobFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ExportJobFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>;
                };
                findFirst: {
                    args: Prisma.ExportJobFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ExportJobFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>;
                };
                findMany: {
                    args: Prisma.ExportJobFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>[];
                };
                create: {
                    args: Prisma.ExportJobCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>;
                };
                createMany: {
                    args: Prisma.ExportJobCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ExportJobCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>[];
                };
                delete: {
                    args: Prisma.ExportJobDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>;
                };
                update: {
                    args: Prisma.ExportJobUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>;
                };
                deleteMany: {
                    args: Prisma.ExportJobDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ExportJobUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ExportJobUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>[];
                };
                upsert: {
                    args: Prisma.ExportJobUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ExportJobPayload>;
                };
                aggregate: {
                    args: Prisma.ExportJobAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateExportJob>;
                };
                groupBy: {
                    args: Prisma.ExportJobGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ExportJobGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ExportJobCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ExportJobCountAggregateOutputType> | number;
                };
            };
        };
        FriendRecord: {
            payload: Prisma.$FriendRecordPayload<ExtArgs>;
            fields: Prisma.FriendRecordFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.FriendRecordFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.FriendRecordFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>;
                };
                findFirst: {
                    args: Prisma.FriendRecordFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.FriendRecordFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>;
                };
                findMany: {
                    args: Prisma.FriendRecordFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>[];
                };
                create: {
                    args: Prisma.FriendRecordCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>;
                };
                createMany: {
                    args: Prisma.FriendRecordCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.FriendRecordCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>[];
                };
                delete: {
                    args: Prisma.FriendRecordDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>;
                };
                update: {
                    args: Prisma.FriendRecordUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>;
                };
                deleteMany: {
                    args: Prisma.FriendRecordDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.FriendRecordUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.FriendRecordUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>[];
                };
                upsert: {
                    args: Prisma.FriendRecordUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FriendRecordPayload>;
                };
                aggregate: {
                    args: Prisma.FriendRecordAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateFriendRecord>;
                };
                groupBy: {
                    args: Prisma.FriendRecordGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.FriendRecordGroupByOutputType>[];
                };
                count: {
                    args: Prisma.FriendRecordCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.FriendRecordCountAggregateOutputType> | number;
                };
            };
        };
        JobLog: {
            payload: Prisma.$JobLogPayload<ExtArgs>;
            fields: Prisma.JobLogFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.JobLogFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.JobLogFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>;
                };
                findFirst: {
                    args: Prisma.JobLogFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.JobLogFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>;
                };
                findMany: {
                    args: Prisma.JobLogFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>[];
                };
                create: {
                    args: Prisma.JobLogCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>;
                };
                createMany: {
                    args: Prisma.JobLogCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.JobLogCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>[];
                };
                delete: {
                    args: Prisma.JobLogDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>;
                };
                update: {
                    args: Prisma.JobLogUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>;
                };
                deleteMany: {
                    args: Prisma.JobLogDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.JobLogUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.JobLogUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>[];
                };
                upsert: {
                    args: Prisma.JobLogUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$JobLogPayload>;
                };
                aggregate: {
                    args: Prisma.JobLogAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateJobLog>;
                };
                groupBy: {
                    args: Prisma.JobLogGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.JobLogGroupByOutputType>[];
                };
                count: {
                    args: Prisma.JobLogCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.JobLogCountAggregateOutputType> | number;
                };
            };
        };
        User: {
            payload: Prisma.$UserPayload<ExtArgs>;
            fields: Prisma.UserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findFirst: {
                    args: Prisma.UserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findMany: {
                    args: Prisma.UserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                create: {
                    args: Prisma.UserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                createMany: {
                    args: Prisma.UserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                delete: {
                    args: Prisma.UserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                update: {
                    args: Prisma.UserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                deleteMany: {
                    args: Prisma.UserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                upsert: {
                    args: Prisma.UserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                aggregate: {
                    args: Prisma.UserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUser>;
                };
                groupBy: {
                    args: Prisma.UserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserCountAggregateOutputType> | number;
                };
            };
        };
        TaskAutomationSettings: {
            payload: Prisma.$TaskAutomationSettingsPayload<ExtArgs>;
            fields: Prisma.TaskAutomationSettingsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TaskAutomationSettingsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TaskAutomationSettingsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>;
                };
                findFirst: {
                    args: Prisma.TaskAutomationSettingsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TaskAutomationSettingsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>;
                };
                findMany: {
                    args: Prisma.TaskAutomationSettingsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>[];
                };
                create: {
                    args: Prisma.TaskAutomationSettingsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>;
                };
                createMany: {
                    args: Prisma.TaskAutomationSettingsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TaskAutomationSettingsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>[];
                };
                delete: {
                    args: Prisma.TaskAutomationSettingsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>;
                };
                update: {
                    args: Prisma.TaskAutomationSettingsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>;
                };
                deleteMany: {
                    args: Prisma.TaskAutomationSettingsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TaskAutomationSettingsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TaskAutomationSettingsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>[];
                };
                upsert: {
                    args: Prisma.TaskAutomationSettingsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TaskAutomationSettingsPayload>;
                };
                aggregate: {
                    args: Prisma.TaskAutomationSettingsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTaskAutomationSettings>;
                };
                groupBy: {
                    args: Prisma.TaskAutomationSettingsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TaskAutomationSettingsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TaskAutomationSettingsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TaskAutomationSettingsCountAggregateOutputType> | number;
                };
            };
        };
        Group: {
            payload: Prisma.$GroupPayload<ExtArgs>;
            fields: Prisma.GroupFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.GroupFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.GroupFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                findFirst: {
                    args: Prisma.GroupFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.GroupFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                findMany: {
                    args: Prisma.GroupFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>[];
                };
                create: {
                    args: Prisma.GroupCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                createMany: {
                    args: Prisma.GroupCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.GroupCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>[];
                };
                delete: {
                    args: Prisma.GroupDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                update: {
                    args: Prisma.GroupUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                deleteMany: {
                    args: Prisma.GroupDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.GroupUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.GroupUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>[];
                };
                upsert: {
                    args: Prisma.GroupUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                aggregate: {
                    args: Prisma.GroupAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateGroup>;
                };
                groupBy: {
                    args: Prisma.GroupGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.GroupGroupByOutputType>[];
                };
                count: {
                    args: Prisma.GroupCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.GroupCountAggregateOutputType> | number;
                };
            };
        };
        Post: {
            payload: Prisma.$PostPayload<ExtArgs>;
            fields: Prisma.PostFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PostFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                findFirst: {
                    args: Prisma.PostFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                findMany: {
                    args: Prisma.PostFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>[];
                };
                create: {
                    args: Prisma.PostCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                createMany: {
                    args: Prisma.PostCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PostCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>[];
                };
                delete: {
                    args: Prisma.PostDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                update: {
                    args: Prisma.PostUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                deleteMany: {
                    args: Prisma.PostDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PostUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PostUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>[];
                };
                upsert: {
                    args: Prisma.PostUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                aggregate: {
                    args: Prisma.PostAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePost>;
                };
                groupBy: {
                    args: Prisma.PostGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PostCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostCountAggregateOutputType> | number;
                };
            };
        };
        Comment: {
            payload: Prisma.$CommentPayload<ExtArgs>;
            fields: Prisma.CommentFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.CommentFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.CommentFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>;
                };
                findFirst: {
                    args: Prisma.CommentFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.CommentFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>;
                };
                findMany: {
                    args: Prisma.CommentFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>[];
                };
                create: {
                    args: Prisma.CommentCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>;
                };
                createMany: {
                    args: Prisma.CommentCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.CommentCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>[];
                };
                delete: {
                    args: Prisma.CommentDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>;
                };
                update: {
                    args: Prisma.CommentUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>;
                };
                deleteMany: {
                    args: Prisma.CommentDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.CommentUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.CommentUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>[];
                };
                upsert: {
                    args: Prisma.CommentUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentPayload>;
                };
                aggregate: {
                    args: Prisma.CommentAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateComment>;
                };
                groupBy: {
                    args: Prisma.CommentGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CommentGroupByOutputType>[];
                };
                count: {
                    args: Prisma.CommentCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CommentCountAggregateOutputType> | number;
                };
            };
        };
        Listing: {
            payload: Prisma.$ListingPayload<ExtArgs>;
            fields: Prisma.ListingFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ListingFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ListingFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>;
                };
                findFirst: {
                    args: Prisma.ListingFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ListingFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>;
                };
                findMany: {
                    args: Prisma.ListingFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>[];
                };
                create: {
                    args: Prisma.ListingCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>;
                };
                createMany: {
                    args: Prisma.ListingCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ListingCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>[];
                };
                delete: {
                    args: Prisma.ListingDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>;
                };
                update: {
                    args: Prisma.ListingUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>;
                };
                deleteMany: {
                    args: Prisma.ListingDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ListingUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ListingUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>[];
                };
                upsert: {
                    args: Prisma.ListingUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ListingPayload>;
                };
                aggregate: {
                    args: Prisma.ListingAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateListing>;
                };
                groupBy: {
                    args: Prisma.ListingGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ListingGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ListingCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ListingCountAggregateOutputType> | number;
                };
            };
        };
        Author: {
            payload: Prisma.$AuthorPayload<ExtArgs>;
            fields: Prisma.AuthorFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AuthorFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AuthorFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>;
                };
                findFirst: {
                    args: Prisma.AuthorFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AuthorFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>;
                };
                findMany: {
                    args: Prisma.AuthorFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>[];
                };
                create: {
                    args: Prisma.AuthorCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>;
                };
                createMany: {
                    args: Prisma.AuthorCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AuthorCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>[];
                };
                delete: {
                    args: Prisma.AuthorDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>;
                };
                update: {
                    args: Prisma.AuthorUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>;
                };
                deleteMany: {
                    args: Prisma.AuthorDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AuthorUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AuthorUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>[];
                };
                upsert: {
                    args: Prisma.AuthorUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuthorPayload>;
                };
                aggregate: {
                    args: Prisma.AuthorAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAuthor>;
                };
                groupBy: {
                    args: Prisma.AuthorGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AuthorGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AuthorCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AuthorCountAggregateOutputType> | number;
                };
            };
        };
        PhotoAnalysis: {
            payload: Prisma.$PhotoAnalysisPayload<ExtArgs>;
            fields: Prisma.PhotoAnalysisFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PhotoAnalysisFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PhotoAnalysisFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>;
                };
                findFirst: {
                    args: Prisma.PhotoAnalysisFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PhotoAnalysisFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>;
                };
                findMany: {
                    args: Prisma.PhotoAnalysisFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>[];
                };
                create: {
                    args: Prisma.PhotoAnalysisCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>;
                };
                createMany: {
                    args: Prisma.PhotoAnalysisCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PhotoAnalysisCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>[];
                };
                delete: {
                    args: Prisma.PhotoAnalysisDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>;
                };
                update: {
                    args: Prisma.PhotoAnalysisUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>;
                };
                deleteMany: {
                    args: Prisma.PhotoAnalysisDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PhotoAnalysisUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PhotoAnalysisUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>[];
                };
                upsert: {
                    args: Prisma.PhotoAnalysisUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PhotoAnalysisPayload>;
                };
                aggregate: {
                    args: Prisma.PhotoAnalysisAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePhotoAnalysis>;
                };
                groupBy: {
                    args: Prisma.PhotoAnalysisGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PhotoAnalysisGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PhotoAnalysisCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PhotoAnalysisCountAggregateOutputType> | number;
                };
            };
        };
        Keyword: {
            payload: Prisma.$KeywordPayload<ExtArgs>;
            fields: Prisma.KeywordFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.KeywordFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.KeywordFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>;
                };
                findFirst: {
                    args: Prisma.KeywordFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.KeywordFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>;
                };
                findMany: {
                    args: Prisma.KeywordFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>[];
                };
                create: {
                    args: Prisma.KeywordCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>;
                };
                createMany: {
                    args: Prisma.KeywordCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.KeywordCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>[];
                };
                delete: {
                    args: Prisma.KeywordDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>;
                };
                update: {
                    args: Prisma.KeywordUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>;
                };
                deleteMany: {
                    args: Prisma.KeywordDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.KeywordUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.KeywordUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>[];
                };
                upsert: {
                    args: Prisma.KeywordUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordPayload>;
                };
                aggregate: {
                    args: Prisma.KeywordAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateKeyword>;
                };
                groupBy: {
                    args: Prisma.KeywordGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordGroupByOutputType>[];
                };
                count: {
                    args: Prisma.KeywordCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordCountAggregateOutputType> | number;
                };
            };
        };
        KeywordForm: {
            payload: Prisma.$KeywordFormPayload<ExtArgs>;
            fields: Prisma.KeywordFormFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.KeywordFormFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.KeywordFormFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>;
                };
                findFirst: {
                    args: Prisma.KeywordFormFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.KeywordFormFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>;
                };
                findMany: {
                    args: Prisma.KeywordFormFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>[];
                };
                create: {
                    args: Prisma.KeywordFormCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>;
                };
                createMany: {
                    args: Prisma.KeywordFormCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.KeywordFormCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>[];
                };
                delete: {
                    args: Prisma.KeywordFormDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>;
                };
                update: {
                    args: Prisma.KeywordFormUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>;
                };
                deleteMany: {
                    args: Prisma.KeywordFormDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.KeywordFormUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.KeywordFormUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>[];
                };
                upsert: {
                    args: Prisma.KeywordFormUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormPayload>;
                };
                aggregate: {
                    args: Prisma.KeywordFormAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateKeywordForm>;
                };
                groupBy: {
                    args: Prisma.KeywordFormGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordFormGroupByOutputType>[];
                };
                count: {
                    args: Prisma.KeywordFormCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordFormCountAggregateOutputType> | number;
                };
            };
        };
        KeywordFormExclusion: {
            payload: Prisma.$KeywordFormExclusionPayload<ExtArgs>;
            fields: Prisma.KeywordFormExclusionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.KeywordFormExclusionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.KeywordFormExclusionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>;
                };
                findFirst: {
                    args: Prisma.KeywordFormExclusionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.KeywordFormExclusionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>;
                };
                findMany: {
                    args: Prisma.KeywordFormExclusionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>[];
                };
                create: {
                    args: Prisma.KeywordFormExclusionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>;
                };
                createMany: {
                    args: Prisma.KeywordFormExclusionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.KeywordFormExclusionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>[];
                };
                delete: {
                    args: Prisma.KeywordFormExclusionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>;
                };
                update: {
                    args: Prisma.KeywordFormExclusionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>;
                };
                deleteMany: {
                    args: Prisma.KeywordFormExclusionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.KeywordFormExclusionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.KeywordFormExclusionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>[];
                };
                upsert: {
                    args: Prisma.KeywordFormExclusionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$KeywordFormExclusionPayload>;
                };
                aggregate: {
                    args: Prisma.KeywordFormExclusionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateKeywordFormExclusion>;
                };
                groupBy: {
                    args: Prisma.KeywordFormExclusionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordFormExclusionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.KeywordFormExclusionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordFormExclusionCountAggregateOutputType> | number;
                };
            };
        };
        MonitoringGroup: {
            payload: Prisma.$MonitoringGroupPayload<ExtArgs>;
            fields: Prisma.MonitoringGroupFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.MonitoringGroupFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.MonitoringGroupFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>;
                };
                findFirst: {
                    args: Prisma.MonitoringGroupFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.MonitoringGroupFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>;
                };
                findMany: {
                    args: Prisma.MonitoringGroupFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>[];
                };
                create: {
                    args: Prisma.MonitoringGroupCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>;
                };
                createMany: {
                    args: Prisma.MonitoringGroupCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.MonitoringGroupCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>[];
                };
                delete: {
                    args: Prisma.MonitoringGroupDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>;
                };
                update: {
                    args: Prisma.MonitoringGroupUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>;
                };
                deleteMany: {
                    args: Prisma.MonitoringGroupDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.MonitoringGroupUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.MonitoringGroupUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>[];
                };
                upsert: {
                    args: Prisma.MonitoringGroupUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MonitoringGroupPayload>;
                };
                aggregate: {
                    args: Prisma.MonitoringGroupAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMonitoringGroup>;
                };
                groupBy: {
                    args: Prisma.MonitoringGroupGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MonitoringGroupGroupByOutputType>[];
                };
                count: {
                    args: Prisma.MonitoringGroupCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MonitoringGroupCountAggregateOutputType> | number;
                };
            };
        };
        CommentKeywordMatch: {
            payload: Prisma.$CommentKeywordMatchPayload<ExtArgs>;
            fields: Prisma.CommentKeywordMatchFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.CommentKeywordMatchFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.CommentKeywordMatchFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>;
                };
                findFirst: {
                    args: Prisma.CommentKeywordMatchFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.CommentKeywordMatchFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>;
                };
                findMany: {
                    args: Prisma.CommentKeywordMatchFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>[];
                };
                create: {
                    args: Prisma.CommentKeywordMatchCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>;
                };
                createMany: {
                    args: Prisma.CommentKeywordMatchCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.CommentKeywordMatchCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>[];
                };
                delete: {
                    args: Prisma.CommentKeywordMatchDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>;
                };
                update: {
                    args: Prisma.CommentKeywordMatchUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>;
                };
                deleteMany: {
                    args: Prisma.CommentKeywordMatchDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.CommentKeywordMatchUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.CommentKeywordMatchUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>[];
                };
                upsert: {
                    args: Prisma.CommentKeywordMatchUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CommentKeywordMatchPayload>;
                };
                aggregate: {
                    args: Prisma.CommentKeywordMatchAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateCommentKeywordMatch>;
                };
                groupBy: {
                    args: Prisma.CommentKeywordMatchGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CommentKeywordMatchGroupByOutputType>[];
                };
                count: {
                    args: Prisma.CommentKeywordMatchCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CommentKeywordMatchCountAggregateOutputType> | number;
                };
            };
        };
        WatchlistSettings: {
            payload: Prisma.$WatchlistSettingsPayload<ExtArgs>;
            fields: Prisma.WatchlistSettingsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WatchlistSettingsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WatchlistSettingsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>;
                };
                findFirst: {
                    args: Prisma.WatchlistSettingsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WatchlistSettingsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>;
                };
                findMany: {
                    args: Prisma.WatchlistSettingsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>[];
                };
                create: {
                    args: Prisma.WatchlistSettingsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>;
                };
                createMany: {
                    args: Prisma.WatchlistSettingsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WatchlistSettingsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>[];
                };
                delete: {
                    args: Prisma.WatchlistSettingsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>;
                };
                update: {
                    args: Prisma.WatchlistSettingsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>;
                };
                deleteMany: {
                    args: Prisma.WatchlistSettingsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WatchlistSettingsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WatchlistSettingsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>[];
                };
                upsert: {
                    args: Prisma.WatchlistSettingsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistSettingsPayload>;
                };
                aggregate: {
                    args: Prisma.WatchlistSettingsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWatchlistSettings>;
                };
                groupBy: {
                    args: Prisma.WatchlistSettingsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WatchlistSettingsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WatchlistSettingsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WatchlistSettingsCountAggregateOutputType> | number;
                };
            };
        };
        WatchlistAuthor: {
            payload: Prisma.$WatchlistAuthorPayload<ExtArgs>;
            fields: Prisma.WatchlistAuthorFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WatchlistAuthorFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WatchlistAuthorFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>;
                };
                findFirst: {
                    args: Prisma.WatchlistAuthorFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WatchlistAuthorFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>;
                };
                findMany: {
                    args: Prisma.WatchlistAuthorFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>[];
                };
                create: {
                    args: Prisma.WatchlistAuthorCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>;
                };
                createMany: {
                    args: Prisma.WatchlistAuthorCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WatchlistAuthorCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>[];
                };
                delete: {
                    args: Prisma.WatchlistAuthorDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>;
                };
                update: {
                    args: Prisma.WatchlistAuthorUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>;
                };
                deleteMany: {
                    args: Prisma.WatchlistAuthorDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WatchlistAuthorUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WatchlistAuthorUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>[];
                };
                upsert: {
                    args: Prisma.WatchlistAuthorUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WatchlistAuthorPayload>;
                };
                aggregate: {
                    args: Prisma.WatchlistAuthorAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWatchlistAuthor>;
                };
                groupBy: {
                    args: Prisma.WatchlistAuthorGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WatchlistAuthorGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WatchlistAuthorCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WatchlistAuthorCountAggregateOutputType> | number;
                };
            };
        };
        TelegramChat: {
            payload: Prisma.$TelegramChatPayload<ExtArgs>;
            fields: Prisma.TelegramChatFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TelegramChatFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TelegramChatFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>;
                };
                findFirst: {
                    args: Prisma.TelegramChatFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TelegramChatFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>;
                };
                findMany: {
                    args: Prisma.TelegramChatFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>[];
                };
                create: {
                    args: Prisma.TelegramChatCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>;
                };
                createMany: {
                    args: Prisma.TelegramChatCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TelegramChatCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>[];
                };
                delete: {
                    args: Prisma.TelegramChatDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>;
                };
                update: {
                    args: Prisma.TelegramChatUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>;
                };
                deleteMany: {
                    args: Prisma.TelegramChatDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TelegramChatUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TelegramChatUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>[];
                };
                upsert: {
                    args: Prisma.TelegramChatUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatPayload>;
                };
                aggregate: {
                    args: Prisma.TelegramChatAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTelegramChat>;
                };
                groupBy: {
                    args: Prisma.TelegramChatGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramChatGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TelegramChatCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramChatCountAggregateOutputType> | number;
                };
            };
        };
        TelegramUser: {
            payload: Prisma.$TelegramUserPayload<ExtArgs>;
            fields: Prisma.TelegramUserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TelegramUserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TelegramUserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>;
                };
                findFirst: {
                    args: Prisma.TelegramUserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TelegramUserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>;
                };
                findMany: {
                    args: Prisma.TelegramUserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>[];
                };
                create: {
                    args: Prisma.TelegramUserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>;
                };
                createMany: {
                    args: Prisma.TelegramUserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TelegramUserCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>[];
                };
                delete: {
                    args: Prisma.TelegramUserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>;
                };
                update: {
                    args: Prisma.TelegramUserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>;
                };
                deleteMany: {
                    args: Prisma.TelegramUserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TelegramUserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TelegramUserUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>[];
                };
                upsert: {
                    args: Prisma.TelegramUserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramUserPayload>;
                };
                aggregate: {
                    args: Prisma.TelegramUserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTelegramUser>;
                };
                groupBy: {
                    args: Prisma.TelegramUserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramUserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TelegramUserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramUserCountAggregateOutputType> | number;
                };
            };
        };
        TelegramChatMember: {
            payload: Prisma.$TelegramChatMemberPayload<ExtArgs>;
            fields: Prisma.TelegramChatMemberFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TelegramChatMemberFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TelegramChatMemberFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>;
                };
                findFirst: {
                    args: Prisma.TelegramChatMemberFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TelegramChatMemberFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>;
                };
                findMany: {
                    args: Prisma.TelegramChatMemberFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>[];
                };
                create: {
                    args: Prisma.TelegramChatMemberCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>;
                };
                createMany: {
                    args: Prisma.TelegramChatMemberCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TelegramChatMemberCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>[];
                };
                delete: {
                    args: Prisma.TelegramChatMemberDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>;
                };
                update: {
                    args: Prisma.TelegramChatMemberUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>;
                };
                deleteMany: {
                    args: Prisma.TelegramChatMemberDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TelegramChatMemberUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TelegramChatMemberUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>[];
                };
                upsert: {
                    args: Prisma.TelegramChatMemberUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramChatMemberPayload>;
                };
                aggregate: {
                    args: Prisma.TelegramChatMemberAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTelegramChatMember>;
                };
                groupBy: {
                    args: Prisma.TelegramChatMemberGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramChatMemberGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TelegramChatMemberCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramChatMemberCountAggregateOutputType> | number;
                };
            };
        };
        TelegramSession: {
            payload: Prisma.$TelegramSessionPayload<ExtArgs>;
            fields: Prisma.TelegramSessionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TelegramSessionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TelegramSessionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>;
                };
                findFirst: {
                    args: Prisma.TelegramSessionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TelegramSessionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>;
                };
                findMany: {
                    args: Prisma.TelegramSessionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>[];
                };
                create: {
                    args: Prisma.TelegramSessionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>;
                };
                createMany: {
                    args: Prisma.TelegramSessionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TelegramSessionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>[];
                };
                delete: {
                    args: Prisma.TelegramSessionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>;
                };
                update: {
                    args: Prisma.TelegramSessionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>;
                };
                deleteMany: {
                    args: Prisma.TelegramSessionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TelegramSessionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TelegramSessionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>[];
                };
                upsert: {
                    args: Prisma.TelegramSessionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSessionPayload>;
                };
                aggregate: {
                    args: Prisma.TelegramSessionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTelegramSession>;
                };
                groupBy: {
                    args: Prisma.TelegramSessionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramSessionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TelegramSessionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramSessionCountAggregateOutputType> | number;
                };
            };
        };
        TelegramSettings: {
            payload: Prisma.$TelegramSettingsPayload<ExtArgs>;
            fields: Prisma.TelegramSettingsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TelegramSettingsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TelegramSettingsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>;
                };
                findFirst: {
                    args: Prisma.TelegramSettingsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TelegramSettingsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>;
                };
                findMany: {
                    args: Prisma.TelegramSettingsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>[];
                };
                create: {
                    args: Prisma.TelegramSettingsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>;
                };
                createMany: {
                    args: Prisma.TelegramSettingsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TelegramSettingsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>[];
                };
                delete: {
                    args: Prisma.TelegramSettingsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>;
                };
                update: {
                    args: Prisma.TelegramSettingsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>;
                };
                deleteMany: {
                    args: Prisma.TelegramSettingsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TelegramSettingsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TelegramSettingsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>[];
                };
                upsert: {
                    args: Prisma.TelegramSettingsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TelegramSettingsPayload>;
                };
                aggregate: {
                    args: Prisma.TelegramSettingsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTelegramSettings>;
                };
                groupBy: {
                    args: Prisma.TelegramSettingsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramSettingsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TelegramSettingsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramSettingsCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $executeRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $executeRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
            $queryRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $queryRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
        };
    };
};
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const TaskScalarFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly completed: "completed";
    readonly totalItems: "totalItems";
    readonly processedItems: "processedItems";
    readonly progress: "progress";
    readonly status: "status";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TaskScalarFieldEnum = (typeof TaskScalarFieldEnum)[keyof typeof TaskScalarFieldEnum];
export declare const TaskAuditLogScalarFieldEnum: {
    readonly id: "id";
    readonly taskId: "taskId";
    readonly eventType: "eventType";
    readonly eventData: "eventData";
    readonly createdAt: "createdAt";
};
export type TaskAuditLogScalarFieldEnum = (typeof TaskAuditLogScalarFieldEnum)[keyof typeof TaskAuditLogScalarFieldEnum];
export declare const ExportJobScalarFieldEnum: {
    readonly id: "id";
    readonly createdAt: "createdAt";
    readonly status: "status";
    readonly params: "params";
    readonly vkUserId: "vkUserId";
    readonly okUserId: "okUserId";
    readonly totalCount: "totalCount";
    readonly fetchedCount: "fetchedCount";
    readonly warning: "warning";
    readonly error: "error";
    readonly xlsxPath: "xlsxPath";
    readonly docxPath: "docxPath";
};
export type ExportJobScalarFieldEnum = (typeof ExportJobScalarFieldEnum)[keyof typeof ExportJobScalarFieldEnum];
export declare const FriendRecordScalarFieldEnum: {
    readonly id: "id";
    readonly jobId: "jobId";
    readonly vkFriendId: "vkFriendId";
    readonly okFriendId: "okFriendId";
    readonly payload: "payload";
    readonly createdAt: "createdAt";
};
export type FriendRecordScalarFieldEnum = (typeof FriendRecordScalarFieldEnum)[keyof typeof FriendRecordScalarFieldEnum];
export declare const JobLogScalarFieldEnum: {
    readonly id: "id";
    readonly jobId: "jobId";
    readonly level: "level";
    readonly message: "message";
    readonly meta: "meta";
    readonly createdAt: "createdAt";
};
export type JobLogScalarFieldEnum = (typeof JobLogScalarFieldEnum)[keyof typeof JobLogScalarFieldEnum];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly username: "username";
    readonly passwordHash: "passwordHash";
    readonly role: "role";
    readonly isTemporaryPassword: "isTemporaryPassword";
    readonly refreshTokenHash: "refreshTokenHash";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const TaskAutomationSettingsScalarFieldEnum: {
    readonly id: "id";
    readonly enabled: "enabled";
    readonly runHour: "runHour";
    readonly runMinute: "runMinute";
    readonly postLimit: "postLimit";
    readonly timezoneOffsetMinutes: "timezoneOffsetMinutes";
    readonly lastRunAt: "lastRunAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TaskAutomationSettingsScalarFieldEnum = (typeof TaskAutomationSettingsScalarFieldEnum)[keyof typeof TaskAutomationSettingsScalarFieldEnum];
export declare const GroupScalarFieldEnum: {
    readonly id: "id";
    readonly vkId: "vkId";
    readonly name: "name";
    readonly screenName: "screenName";
    readonly isClosed: "isClosed";
    readonly deactivated: "deactivated";
    readonly type: "type";
    readonly photo50: "photo50";
    readonly photo100: "photo100";
    readonly photo200: "photo200";
    readonly activity: "activity";
    readonly ageLimits: "ageLimits";
    readonly description: "description";
    readonly membersCount: "membersCount";
    readonly status: "status";
    readonly verified: "verified";
    readonly wall: "wall";
    readonly addresses: "addresses";
    readonly city: "city";
    readonly counters: "counters";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type GroupScalarFieldEnum = (typeof GroupScalarFieldEnum)[keyof typeof GroupScalarFieldEnum];
export declare const PostScalarFieldEnum: {
    readonly id: "id";
    readonly ownerId: "ownerId";
    readonly vkPostId: "vkPostId";
    readonly fromId: "fromId";
    readonly postedAt: "postedAt";
    readonly text: "text";
    readonly attachments: "attachments";
    readonly commentsCount: "commentsCount";
    readonly commentsCanPost: "commentsCanPost";
    readonly commentsGroupsCanPost: "commentsGroupsCanPost";
    readonly commentsCanClose: "commentsCanClose";
    readonly commentsCanOpen: "commentsCanOpen";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly groupId: "groupId";
};
export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum];
export declare const CommentScalarFieldEnum: {
    readonly id: "id";
    readonly postId: "postId";
    readonly ownerId: "ownerId";
    readonly vkCommentId: "vkCommentId";
    readonly fromId: "fromId";
    readonly text: "text";
    readonly publishedAt: "publishedAt";
    readonly likesCount: "likesCount";
    readonly parentsStack: "parentsStack";
    readonly threadCount: "threadCount";
    readonly threadItems: "threadItems";
    readonly attachments: "attachments";
    readonly replyToUser: "replyToUser";
    readonly replyToComment: "replyToComment";
    readonly authorVkId: "authorVkId";
    readonly isDeleted: "isDeleted";
    readonly isRead: "isRead";
    readonly source: "source";
    readonly watchlistAuthorId: "watchlistAuthorId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type CommentScalarFieldEnum = (typeof CommentScalarFieldEnum)[keyof typeof CommentScalarFieldEnum];
export declare const ListingScalarFieldEnum: {
    readonly id: "id";
    readonly source: "source";
    readonly externalId: "externalId";
    readonly title: "title";
    readonly description: "description";
    readonly url: "url";
    readonly price: "price";
    readonly currency: "currency";
    readonly address: "address";
    readonly city: "city";
    readonly latitude: "latitude";
    readonly longitude: "longitude";
    readonly rooms: "rooms";
    readonly areaTotal: "areaTotal";
    readonly areaLiving: "areaLiving";
    readonly areaKitchen: "areaKitchen";
    readonly floor: "floor";
    readonly floorsTotal: "floorsTotal";
    readonly publishedAt: "publishedAt";
    readonly contactName: "contactName";
    readonly contactPhone: "contactPhone";
    readonly images: "images";
    readonly sourceAuthorName: "sourceAuthorName";
    readonly sourceAuthorPhone: "sourceAuthorPhone";
    readonly sourceAuthorUrl: "sourceAuthorUrl";
    readonly sourcePostedAt: "sourcePostedAt";
    readonly sourceParsedAt: "sourceParsedAt";
    readonly manualOverrides: "manualOverrides";
    readonly manualNote: "manualNote";
    readonly archived: "archived";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ListingScalarFieldEnum = (typeof ListingScalarFieldEnum)[keyof typeof ListingScalarFieldEnum];
export declare const AuthorScalarFieldEnum: {
    readonly id: "id";
    readonly vkUserId: "vkUserId";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly deactivated: "deactivated";
    readonly domain: "domain";
    readonly screenName: "screenName";
    readonly isClosed: "isClosed";
    readonly canAccessClosed: "canAccessClosed";
    readonly photo50: "photo50";
    readonly photo100: "photo100";
    readonly photo200: "photo200";
    readonly photo200Orig: "photo200Orig";
    readonly photo400Orig: "photo400Orig";
    readonly photoMax: "photoMax";
    readonly photoMaxOrig: "photoMaxOrig";
    readonly photoId: "photoId";
    readonly city: "city";
    readonly country: "country";
    readonly about: "about";
    readonly activities: "activities";
    readonly bdate: "bdate";
    readonly books: "books";
    readonly career: "career";
    readonly connections: "connections";
    readonly contacts: "contacts";
    readonly counters: "counters";
    readonly education: "education";
    readonly followersCount: "followersCount";
    readonly homeTown: "homeTown";
    readonly interests: "interests";
    readonly lastSeen: "lastSeen";
    readonly maidenName: "maidenName";
    readonly military: "military";
    readonly movies: "movies";
    readonly music: "music";
    readonly nickname: "nickname";
    readonly occupation: "occupation";
    readonly personal: "personal";
    readonly relatives: "relatives";
    readonly relation: "relation";
    readonly schools: "schools";
    readonly sex: "sex";
    readonly site: "site";
    readonly status: "status";
    readonly timezone: "timezone";
    readonly tv: "tv";
    readonly universities: "universities";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly verifiedAt: "verifiedAt";
};
export type AuthorScalarFieldEnum = (typeof AuthorScalarFieldEnum)[keyof typeof AuthorScalarFieldEnum];
export declare const PhotoAnalysisScalarFieldEnum: {
    readonly id: "id";
    readonly authorId: "authorId";
    readonly photoUrl: "photoUrl";
    readonly photoVkId: "photoVkId";
    readonly analysisResult: "analysisResult";
    readonly hasSuspicious: "hasSuspicious";
    readonly suspicionLevel: "suspicionLevel";
    readonly categories: "categories";
    readonly confidence: "confidence";
    readonly explanation: "explanation";
    readonly analyzedAt: "analyzedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PhotoAnalysisScalarFieldEnum = (typeof PhotoAnalysisScalarFieldEnum)[keyof typeof PhotoAnalysisScalarFieldEnum];
export declare const KeywordScalarFieldEnum: {
    readonly id: "id";
    readonly word: "word";
    readonly category: "category";
    readonly isPhrase: "isPhrase";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type KeywordScalarFieldEnum = (typeof KeywordScalarFieldEnum)[keyof typeof KeywordScalarFieldEnum];
export declare const KeywordFormScalarFieldEnum: {
    readonly id: "id";
    readonly keywordId: "keywordId";
    readonly form: "form";
    readonly source: "source";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type KeywordFormScalarFieldEnum = (typeof KeywordFormScalarFieldEnum)[keyof typeof KeywordFormScalarFieldEnum];
export declare const KeywordFormExclusionScalarFieldEnum: {
    readonly id: "id";
    readonly keywordId: "keywordId";
    readonly form: "form";
    readonly createdAt: "createdAt";
};
export type KeywordFormExclusionScalarFieldEnum = (typeof KeywordFormExclusionScalarFieldEnum)[keyof typeof KeywordFormExclusionScalarFieldEnum];
export declare const MonitoringGroupScalarFieldEnum: {
    readonly id: "id";
    readonly messenger: "messenger";
    readonly chatId: "chatId";
    readonly name: "name";
    readonly category: "category";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type MonitoringGroupScalarFieldEnum = (typeof MonitoringGroupScalarFieldEnum)[keyof typeof MonitoringGroupScalarFieldEnum];
export declare const CommentKeywordMatchScalarFieldEnum: {
    readonly commentId: "commentId";
    readonly keywordId: "keywordId";
    readonly source: "source";
    readonly createdAt: "createdAt";
};
export type CommentKeywordMatchScalarFieldEnum = (typeof CommentKeywordMatchScalarFieldEnum)[keyof typeof CommentKeywordMatchScalarFieldEnum];
export declare const WatchlistSettingsScalarFieldEnum: {
    readonly id: "id";
    readonly trackAllComments: "trackAllComments";
    readonly pollIntervalMinutes: "pollIntervalMinutes";
    readonly maxAuthors: "maxAuthors";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type WatchlistSettingsScalarFieldEnum = (typeof WatchlistSettingsScalarFieldEnum)[keyof typeof WatchlistSettingsScalarFieldEnum];
export declare const WatchlistAuthorScalarFieldEnum: {
    readonly id: "id";
    readonly authorVkId: "authorVkId";
    readonly sourceCommentId: "sourceCommentId";
    readonly status: "status";
    readonly lastCheckedAt: "lastCheckedAt";
    readonly lastActivityAt: "lastActivityAt";
    readonly foundCommentsCount: "foundCommentsCount";
    readonly monitoringStartedAt: "monitoringStartedAt";
    readonly monitoringStoppedAt: "monitoringStoppedAt";
    readonly settingsId: "settingsId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type WatchlistAuthorScalarFieldEnum = (typeof WatchlistAuthorScalarFieldEnum)[keyof typeof WatchlistAuthorScalarFieldEnum];
export declare const TelegramChatScalarFieldEnum: {
    readonly id: "id";
    readonly telegramId: "telegramId";
    readonly type: "type";
    readonly title: "title";
    readonly username: "username";
    readonly accessHash: "accessHash";
    readonly photoUrl: "photoUrl";
    readonly description: "description";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TelegramChatScalarFieldEnum = (typeof TelegramChatScalarFieldEnum)[keyof typeof TelegramChatScalarFieldEnum];
export declare const TelegramUserScalarFieldEnum: {
    readonly id: "id";
    readonly telegramId: "telegramId";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly username: "username";
    readonly phoneNumber: "phoneNumber";
    readonly bio: "bio";
    readonly languageCode: "languageCode";
    readonly isBot: "isBot";
    readonly isPremium: "isPremium";
    readonly deleted: "deleted";
    readonly restricted: "restricted";
    readonly verified: "verified";
    readonly scam: "scam";
    readonly fake: "fake";
    readonly min: "min";
    readonly self: "self";
    readonly contact: "contact";
    readonly mutualContact: "mutualContact";
    readonly accessHash: "accessHash";
    readonly photoId: "photoId";
    readonly photoDcId: "photoDcId";
    readonly photoHasVideo: "photoHasVideo";
    readonly commonChatsCount: "commonChatsCount";
    readonly usernames: "usernames";
    readonly personal: "personal";
    readonly botInfo: "botInfo";
    readonly blocked: "blocked";
    readonly contactRequirePremium: "contactRequirePremium";
    readonly spam: "spam";
    readonly closeFriend: "closeFriend";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TelegramUserScalarFieldEnum = (typeof TelegramUserScalarFieldEnum)[keyof typeof TelegramUserScalarFieldEnum];
export declare const TelegramChatMemberScalarFieldEnum: {
    readonly id: "id";
    readonly chatId: "chatId";
    readonly userId: "userId";
    readonly status: "status";
    readonly isAdmin: "isAdmin";
    readonly isOwner: "isOwner";
    readonly joinedAt: "joinedAt";
    readonly leftAt: "leftAt";
    readonly importedAt: "importedAt";
    readonly rawPayload: "rawPayload";
};
export type TelegramChatMemberScalarFieldEnum = (typeof TelegramChatMemberScalarFieldEnum)[keyof typeof TelegramChatMemberScalarFieldEnum];
export declare const TelegramSessionScalarFieldEnum: {
    readonly id: "id";
    readonly session: "session";
    readonly userId: "userId";
    readonly username: "username";
    readonly phoneNumber: "phoneNumber";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TelegramSessionScalarFieldEnum = (typeof TelegramSessionScalarFieldEnum)[keyof typeof TelegramSessionScalarFieldEnum];
export declare const TelegramSettingsScalarFieldEnum: {
    readonly id: "id";
    readonly phoneNumber: "phoneNumber";
    readonly apiId: "apiId";
    readonly apiHash: "apiHash";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TelegramSettingsScalarFieldEnum = (typeof TelegramSettingsScalarFieldEnum)[keyof typeof TelegramSettingsScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const JsonNullValueInput: {
    readonly JsonNull: runtime.JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
    readonly AnyNull: runtime.AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>;
export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>;
export type EnumExportJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExportJobStatus'>;
export type ListEnumExportJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExportJobStatus[]'>;
export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>;
export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>;
export type EnumJobLogLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobLogLevel'>;
export type ListEnumJobLogLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobLogLevel[]'>;
export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>;
export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>;
export type EnumCommentSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CommentSource'>;
export type ListEnumCommentSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CommentSource[]'>;
export type EnumSuspicionLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuspicionLevel'>;
export type ListEnumSuspicionLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuspicionLevel[]'>;
export type EnumKeywordFormSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'KeywordFormSource'>;
export type ListEnumKeywordFormSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'KeywordFormSource[]'>;
export type EnumMonitoringMessengerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MonitoringMessenger'>;
export type ListEnumMonitoringMessengerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MonitoringMessenger[]'>;
export type EnumMatchSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MatchSource'>;
export type ListEnumMatchSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MatchSource[]'>;
export type EnumWatchlistStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WatchlistStatus'>;
export type ListEnumWatchlistStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WatchlistStatus[]'>;
export type EnumTelegramChatTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TelegramChatType'>;
export type ListEnumTelegramChatTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TelegramChatType[]'>;
export type EnumTelegramMemberStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TelegramMemberStatus'>;
export type ListEnumTelegramMemberStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TelegramMemberStatus[]'>;
export type BatchPayload = {
    count: number;
};
export declare const defineExtension: runtime.Types.Extensions.ExtendsHook<"define", TypeMapCb, runtime.Types.Extensions.DefaultArgs>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export type PrismaClientOptions = ({
    adapter: runtime.SqlDriverAdapterFactory;
    accelerateUrl?: never;
} | {
    accelerateUrl: string;
    adapter?: never;
}) & {
    errorFormat?: ErrorFormat;
    log?: (LogLevel | LogDefinition)[];
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: TransactionIsolationLevel;
    };
    omit?: GlobalOmitConfig;
    comments?: runtime.SqlCommenterPlugin[];
};
export type GlobalOmitConfig = {
    task?: Prisma.TaskOmit;
    taskAuditLog?: Prisma.TaskAuditLogOmit;
    exportJob?: Prisma.ExportJobOmit;
    friendRecord?: Prisma.FriendRecordOmit;
    jobLog?: Prisma.JobLogOmit;
    user?: Prisma.UserOmit;
    taskAutomationSettings?: Prisma.TaskAutomationSettingsOmit;
    group?: Prisma.GroupOmit;
    post?: Prisma.PostOmit;
    comment?: Prisma.CommentOmit;
    listing?: Prisma.ListingOmit;
    author?: Prisma.AuthorOmit;
    photoAnalysis?: Prisma.PhotoAnalysisOmit;
    keyword?: Prisma.KeywordOmit;
    keywordForm?: Prisma.KeywordFormOmit;
    keywordFormExclusion?: Prisma.KeywordFormExclusionOmit;
    monitoringGroup?: Prisma.MonitoringGroupOmit;
    commentKeywordMatch?: Prisma.CommentKeywordMatchOmit;
    watchlistSettings?: Prisma.WatchlistSettingsOmit;
    watchlistAuthor?: Prisma.WatchlistAuthorOmit;
    telegramChat?: Prisma.TelegramChatOmit;
    telegramUser?: Prisma.TelegramUserOmit;
    telegramChatMember?: Prisma.TelegramChatMemberOmit;
    telegramSession?: Prisma.TelegramSessionOmit;
    telegramSettings?: Prisma.TelegramSettingsOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
