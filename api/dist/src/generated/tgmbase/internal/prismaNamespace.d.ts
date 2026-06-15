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
    readonly channel: "channel";
    readonly group: "group";
    readonly keyword: "keyword";
    readonly message: "message";
    readonly snitch_admin: "snitch_admin";
    readonly supergroup: "supergroup";
    readonly telegramnotify: "telegramnotify";
    readonly user: "user";
    readonly DlImportBatch: "DlImportBatch";
    readonly DlImportFile: "DlImportFile";
    readonly DlContact: "DlContact";
    readonly DlMatchRun: "DlMatchRun";
    readonly DlMatchResult: "DlMatchResult";
    readonly DlMatchResultChat: "DlMatchResultChat";
    readonly DlMatchResultMessage: "DlMatchResultMessage";
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
        modelProps: "channel" | "group" | "keyword" | "message" | "snitch_admin" | "supergroup" | "telegramnotify" | "user" | "dlImportBatch" | "dlImportFile" | "dlContact" | "dlMatchRun" | "dlMatchResult" | "dlMatchResultChat" | "dlMatchResultMessage";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        channel: {
            payload: Prisma.$channelPayload<ExtArgs>;
            fields: Prisma.channelFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.channelFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.channelFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>;
                };
                findFirst: {
                    args: Prisma.channelFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.channelFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>;
                };
                findMany: {
                    args: Prisma.channelFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>[];
                };
                create: {
                    args: Prisma.channelCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>;
                };
                createMany: {
                    args: Prisma.channelCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.channelCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>[];
                };
                delete: {
                    args: Prisma.channelDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>;
                };
                update: {
                    args: Prisma.channelUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>;
                };
                deleteMany: {
                    args: Prisma.channelDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.channelUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.channelUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>[];
                };
                upsert: {
                    args: Prisma.channelUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$channelPayload>;
                };
                aggregate: {
                    args: Prisma.ChannelAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateChannel>;
                };
                groupBy: {
                    args: Prisma.channelGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ChannelGroupByOutputType>[];
                };
                count: {
                    args: Prisma.channelCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ChannelCountAggregateOutputType> | number;
                };
            };
        };
        group: {
            payload: Prisma.$groupPayload<ExtArgs>;
            fields: Prisma.groupFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.groupFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.groupFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>;
                };
                findFirst: {
                    args: Prisma.groupFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.groupFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>;
                };
                findMany: {
                    args: Prisma.groupFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>[];
                };
                create: {
                    args: Prisma.groupCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>;
                };
                createMany: {
                    args: Prisma.groupCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.groupCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>[];
                };
                delete: {
                    args: Prisma.groupDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>;
                };
                update: {
                    args: Prisma.groupUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>;
                };
                deleteMany: {
                    args: Prisma.groupDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.groupUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.groupUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>[];
                };
                upsert: {
                    args: Prisma.groupUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$groupPayload>;
                };
                aggregate: {
                    args: Prisma.GroupAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateGroup>;
                };
                groupBy: {
                    args: Prisma.groupGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.GroupGroupByOutputType>[];
                };
                count: {
                    args: Prisma.groupCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.GroupCountAggregateOutputType> | number;
                };
            };
        };
        keyword: {
            payload: Prisma.$keywordPayload<ExtArgs>;
            fields: Prisma.keywordFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.keywordFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.keywordFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>;
                };
                findFirst: {
                    args: Prisma.keywordFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.keywordFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>;
                };
                findMany: {
                    args: Prisma.keywordFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>[];
                };
                create: {
                    args: Prisma.keywordCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>;
                };
                createMany: {
                    args: Prisma.keywordCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.keywordCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>[];
                };
                delete: {
                    args: Prisma.keywordDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>;
                };
                update: {
                    args: Prisma.keywordUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>;
                };
                deleteMany: {
                    args: Prisma.keywordDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.keywordUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.keywordUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>[];
                };
                upsert: {
                    args: Prisma.keywordUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$keywordPayload>;
                };
                aggregate: {
                    args: Prisma.KeywordAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateKeyword>;
                };
                groupBy: {
                    args: Prisma.keywordGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordGroupByOutputType>[];
                };
                count: {
                    args: Prisma.keywordCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.KeywordCountAggregateOutputType> | number;
                };
            };
        };
        message: {
            payload: Prisma.$messagePayload<ExtArgs>;
            fields: Prisma.messageFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.messageFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.messageFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>;
                };
                findFirst: {
                    args: Prisma.messageFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.messageFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>;
                };
                findMany: {
                    args: Prisma.messageFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>[];
                };
                create: {
                    args: Prisma.messageCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>;
                };
                createMany: {
                    args: Prisma.messageCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.messageCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>[];
                };
                delete: {
                    args: Prisma.messageDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>;
                };
                update: {
                    args: Prisma.messageUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>;
                };
                deleteMany: {
                    args: Prisma.messageDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.messageUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.messageUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>[];
                };
                upsert: {
                    args: Prisma.messageUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$messagePayload>;
                };
                aggregate: {
                    args: Prisma.MessageAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMessage>;
                };
                groupBy: {
                    args: Prisma.messageGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageGroupByOutputType>[];
                };
                count: {
                    args: Prisma.messageCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageCountAggregateOutputType> | number;
                };
            };
        };
        snitch_admin: {
            payload: Prisma.$snitch_adminPayload<ExtArgs>;
            fields: Prisma.snitch_adminFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.snitch_adminFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.snitch_adminFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>;
                };
                findFirst: {
                    args: Prisma.snitch_adminFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.snitch_adminFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>;
                };
                findMany: {
                    args: Prisma.snitch_adminFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>[];
                };
                create: {
                    args: Prisma.snitch_adminCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>;
                };
                createMany: {
                    args: Prisma.snitch_adminCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.snitch_adminCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>[];
                };
                delete: {
                    args: Prisma.snitch_adminDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>;
                };
                update: {
                    args: Prisma.snitch_adminUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>;
                };
                deleteMany: {
                    args: Prisma.snitch_adminDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.snitch_adminUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.snitch_adminUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>[];
                };
                upsert: {
                    args: Prisma.snitch_adminUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$snitch_adminPayload>;
                };
                aggregate: {
                    args: Prisma.Snitch_adminAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSnitch_admin>;
                };
                groupBy: {
                    args: Prisma.snitch_adminGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Snitch_adminGroupByOutputType>[];
                };
                count: {
                    args: Prisma.snitch_adminCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Snitch_adminCountAggregateOutputType> | number;
                };
            };
        };
        supergroup: {
            payload: Prisma.$supergroupPayload<ExtArgs>;
            fields: Prisma.supergroupFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.supergroupFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.supergroupFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>;
                };
                findFirst: {
                    args: Prisma.supergroupFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.supergroupFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>;
                };
                findMany: {
                    args: Prisma.supergroupFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>[];
                };
                create: {
                    args: Prisma.supergroupCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>;
                };
                createMany: {
                    args: Prisma.supergroupCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.supergroupCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>[];
                };
                delete: {
                    args: Prisma.supergroupDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>;
                };
                update: {
                    args: Prisma.supergroupUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>;
                };
                deleteMany: {
                    args: Prisma.supergroupDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.supergroupUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.supergroupUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>[];
                };
                upsert: {
                    args: Prisma.supergroupUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$supergroupPayload>;
                };
                aggregate: {
                    args: Prisma.SupergroupAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSupergroup>;
                };
                groupBy: {
                    args: Prisma.supergroupGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SupergroupGroupByOutputType>[];
                };
                count: {
                    args: Prisma.supergroupCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SupergroupCountAggregateOutputType> | number;
                };
            };
        };
        telegramnotify: {
            payload: Prisma.$telegramnotifyPayload<ExtArgs>;
            fields: Prisma.telegramnotifyFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.telegramnotifyFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.telegramnotifyFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>;
                };
                findFirst: {
                    args: Prisma.telegramnotifyFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.telegramnotifyFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>;
                };
                findMany: {
                    args: Prisma.telegramnotifyFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>[];
                };
                create: {
                    args: Prisma.telegramnotifyCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>;
                };
                createMany: {
                    args: Prisma.telegramnotifyCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.telegramnotifyCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>[];
                };
                delete: {
                    args: Prisma.telegramnotifyDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>;
                };
                update: {
                    args: Prisma.telegramnotifyUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>;
                };
                deleteMany: {
                    args: Prisma.telegramnotifyDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.telegramnotifyUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.telegramnotifyUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>[];
                };
                upsert: {
                    args: Prisma.telegramnotifyUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$telegramnotifyPayload>;
                };
                aggregate: {
                    args: Prisma.TelegramnotifyAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTelegramnotify>;
                };
                groupBy: {
                    args: Prisma.telegramnotifyGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramnotifyGroupByOutputType>[];
                };
                count: {
                    args: Prisma.telegramnotifyCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TelegramnotifyCountAggregateOutputType> | number;
                };
            };
        };
        user: {
            payload: Prisma.$userPayload<ExtArgs>;
            fields: Prisma.userFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.userFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.userFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>;
                };
                findFirst: {
                    args: Prisma.userFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.userFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>;
                };
                findMany: {
                    args: Prisma.userFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>[];
                };
                create: {
                    args: Prisma.userCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>;
                };
                createMany: {
                    args: Prisma.userCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.userCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>[];
                };
                delete: {
                    args: Prisma.userDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>;
                };
                update: {
                    args: Prisma.userUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>;
                };
                deleteMany: {
                    args: Prisma.userDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.userUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.userUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>[];
                };
                upsert: {
                    args: Prisma.userUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$userPayload>;
                };
                aggregate: {
                    args: Prisma.UserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUser>;
                };
                groupBy: {
                    args: Prisma.userGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.userCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserCountAggregateOutputType> | number;
                };
            };
        };
        DlImportBatch: {
            payload: Prisma.$DlImportBatchPayload<ExtArgs>;
            fields: Prisma.DlImportBatchFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DlImportBatchFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DlImportBatchFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>;
                };
                findFirst: {
                    args: Prisma.DlImportBatchFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DlImportBatchFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>;
                };
                findMany: {
                    args: Prisma.DlImportBatchFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>[];
                };
                create: {
                    args: Prisma.DlImportBatchCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>;
                };
                createMany: {
                    args: Prisma.DlImportBatchCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DlImportBatchCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>[];
                };
                delete: {
                    args: Prisma.DlImportBatchDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>;
                };
                update: {
                    args: Prisma.DlImportBatchUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>;
                };
                deleteMany: {
                    args: Prisma.DlImportBatchDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DlImportBatchUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DlImportBatchUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>[];
                };
                upsert: {
                    args: Prisma.DlImportBatchUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportBatchPayload>;
                };
                aggregate: {
                    args: Prisma.DlImportBatchAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDlImportBatch>;
                };
                groupBy: {
                    args: Prisma.DlImportBatchGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlImportBatchGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DlImportBatchCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlImportBatchCountAggregateOutputType> | number;
                };
            };
        };
        DlImportFile: {
            payload: Prisma.$DlImportFilePayload<ExtArgs>;
            fields: Prisma.DlImportFileFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DlImportFileFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DlImportFileFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>;
                };
                findFirst: {
                    args: Prisma.DlImportFileFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DlImportFileFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>;
                };
                findMany: {
                    args: Prisma.DlImportFileFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>[];
                };
                create: {
                    args: Prisma.DlImportFileCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>;
                };
                createMany: {
                    args: Prisma.DlImportFileCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DlImportFileCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>[];
                };
                delete: {
                    args: Prisma.DlImportFileDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>;
                };
                update: {
                    args: Prisma.DlImportFileUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>;
                };
                deleteMany: {
                    args: Prisma.DlImportFileDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DlImportFileUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DlImportFileUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>[];
                };
                upsert: {
                    args: Prisma.DlImportFileUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlImportFilePayload>;
                };
                aggregate: {
                    args: Prisma.DlImportFileAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDlImportFile>;
                };
                groupBy: {
                    args: Prisma.DlImportFileGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlImportFileGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DlImportFileCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlImportFileCountAggregateOutputType> | number;
                };
            };
        };
        DlContact: {
            payload: Prisma.$DlContactPayload<ExtArgs>;
            fields: Prisma.DlContactFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DlContactFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DlContactFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>;
                };
                findFirst: {
                    args: Prisma.DlContactFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DlContactFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>;
                };
                findMany: {
                    args: Prisma.DlContactFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>[];
                };
                create: {
                    args: Prisma.DlContactCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>;
                };
                createMany: {
                    args: Prisma.DlContactCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DlContactCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>[];
                };
                delete: {
                    args: Prisma.DlContactDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>;
                };
                update: {
                    args: Prisma.DlContactUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>;
                };
                deleteMany: {
                    args: Prisma.DlContactDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DlContactUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DlContactUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>[];
                };
                upsert: {
                    args: Prisma.DlContactUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlContactPayload>;
                };
                aggregate: {
                    args: Prisma.DlContactAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDlContact>;
                };
                groupBy: {
                    args: Prisma.DlContactGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlContactGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DlContactCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlContactCountAggregateOutputType> | number;
                };
            };
        };
        DlMatchRun: {
            payload: Prisma.$DlMatchRunPayload<ExtArgs>;
            fields: Prisma.DlMatchRunFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DlMatchRunFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DlMatchRunFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>;
                };
                findFirst: {
                    args: Prisma.DlMatchRunFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DlMatchRunFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>;
                };
                findMany: {
                    args: Prisma.DlMatchRunFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>[];
                };
                create: {
                    args: Prisma.DlMatchRunCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>;
                };
                createMany: {
                    args: Prisma.DlMatchRunCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DlMatchRunCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>[];
                };
                delete: {
                    args: Prisma.DlMatchRunDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>;
                };
                update: {
                    args: Prisma.DlMatchRunUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>;
                };
                deleteMany: {
                    args: Prisma.DlMatchRunDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DlMatchRunUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DlMatchRunUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>[];
                };
                upsert: {
                    args: Prisma.DlMatchRunUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchRunPayload>;
                };
                aggregate: {
                    args: Prisma.DlMatchRunAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDlMatchRun>;
                };
                groupBy: {
                    args: Prisma.DlMatchRunGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchRunGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DlMatchRunCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchRunCountAggregateOutputType> | number;
                };
            };
        };
        DlMatchResult: {
            payload: Prisma.$DlMatchResultPayload<ExtArgs>;
            fields: Prisma.DlMatchResultFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DlMatchResultFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DlMatchResultFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>;
                };
                findFirst: {
                    args: Prisma.DlMatchResultFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DlMatchResultFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>;
                };
                findMany: {
                    args: Prisma.DlMatchResultFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>[];
                };
                create: {
                    args: Prisma.DlMatchResultCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>;
                };
                createMany: {
                    args: Prisma.DlMatchResultCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DlMatchResultCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>[];
                };
                delete: {
                    args: Prisma.DlMatchResultDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>;
                };
                update: {
                    args: Prisma.DlMatchResultUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>;
                };
                deleteMany: {
                    args: Prisma.DlMatchResultDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DlMatchResultUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DlMatchResultUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>[];
                };
                upsert: {
                    args: Prisma.DlMatchResultUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultPayload>;
                };
                aggregate: {
                    args: Prisma.DlMatchResultAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDlMatchResult>;
                };
                groupBy: {
                    args: Prisma.DlMatchResultGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchResultGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DlMatchResultCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchResultCountAggregateOutputType> | number;
                };
            };
        };
        DlMatchResultChat: {
            payload: Prisma.$DlMatchResultChatPayload<ExtArgs>;
            fields: Prisma.DlMatchResultChatFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DlMatchResultChatFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DlMatchResultChatFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>;
                };
                findFirst: {
                    args: Prisma.DlMatchResultChatFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DlMatchResultChatFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>;
                };
                findMany: {
                    args: Prisma.DlMatchResultChatFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>[];
                };
                create: {
                    args: Prisma.DlMatchResultChatCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>;
                };
                createMany: {
                    args: Prisma.DlMatchResultChatCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DlMatchResultChatCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>[];
                };
                delete: {
                    args: Prisma.DlMatchResultChatDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>;
                };
                update: {
                    args: Prisma.DlMatchResultChatUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>;
                };
                deleteMany: {
                    args: Prisma.DlMatchResultChatDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DlMatchResultChatUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DlMatchResultChatUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>[];
                };
                upsert: {
                    args: Prisma.DlMatchResultChatUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultChatPayload>;
                };
                aggregate: {
                    args: Prisma.DlMatchResultChatAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDlMatchResultChat>;
                };
                groupBy: {
                    args: Prisma.DlMatchResultChatGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchResultChatGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DlMatchResultChatCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchResultChatCountAggregateOutputType> | number;
                };
            };
        };
        DlMatchResultMessage: {
            payload: Prisma.$DlMatchResultMessagePayload<ExtArgs>;
            fields: Prisma.DlMatchResultMessageFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DlMatchResultMessageFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DlMatchResultMessageFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>;
                };
                findFirst: {
                    args: Prisma.DlMatchResultMessageFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DlMatchResultMessageFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>;
                };
                findMany: {
                    args: Prisma.DlMatchResultMessageFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>[];
                };
                create: {
                    args: Prisma.DlMatchResultMessageCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>;
                };
                createMany: {
                    args: Prisma.DlMatchResultMessageCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DlMatchResultMessageCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>[];
                };
                delete: {
                    args: Prisma.DlMatchResultMessageDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>;
                };
                update: {
                    args: Prisma.DlMatchResultMessageUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>;
                };
                deleteMany: {
                    args: Prisma.DlMatchResultMessageDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DlMatchResultMessageUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DlMatchResultMessageUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>[];
                };
                upsert: {
                    args: Prisma.DlMatchResultMessageUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DlMatchResultMessagePayload>;
                };
                aggregate: {
                    args: Prisma.DlMatchResultMessageAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDlMatchResultMessage>;
                };
                groupBy: {
                    args: Prisma.DlMatchResultMessageGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchResultMessageGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DlMatchResultMessageCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DlMatchResultMessageCountAggregateOutputType> | number;
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
export declare const ChannelScalarFieldEnum: {
    readonly id: "id";
    readonly channel_id: "channel_id";
    readonly title: "title";
    readonly date: "date";
    readonly scam: "scam";
    readonly username: "username";
    readonly participants_count: "participants_count";
    readonly region: "region";
    readonly description: "description";
    readonly upd_date: "upd_date";
};
export type ChannelScalarFieldEnum = (typeof ChannelScalarFieldEnum)[keyof typeof ChannelScalarFieldEnum];
export declare const GroupScalarFieldEnum: {
    readonly id: "id";
    readonly group_id: "group_id";
    readonly title: "title";
    readonly participants_count: "participants_count";
    readonly date: "date";
    readonly region: "region";
    readonly description: "description";
    readonly upd_date: "upd_date";
};
export type GroupScalarFieldEnum = (typeof GroupScalarFieldEnum)[keyof typeof GroupScalarFieldEnum];
export declare const KeywordScalarFieldEnum: {
    readonly id: "id";
    readonly word: "word";
    readonly declension: "declension";
    readonly region: "region";
};
export type KeywordScalarFieldEnum = (typeof KeywordScalarFieldEnum)[keyof typeof KeywordScalarFieldEnum];
export declare const MessageScalarFieldEnum: {
    readonly id: "id";
    readonly message_id: "message_id";
    readonly peer_id: "peer_id";
    readonly date: "date";
    readonly message: "message";
    readonly from_id: "from_id";
    readonly forwarded: "forwarded";
    readonly reply_to: "reply_to";
    readonly media: "media";
    readonly keywords: "keywords";
};
export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum];
export declare const Snitch_adminScalarFieldEnum: {
    readonly id: "id";
    readonly login: "login";
    readonly password: "password";
    readonly last_login: "last_login";
};
export type Snitch_adminScalarFieldEnum = (typeof Snitch_adminScalarFieldEnum)[keyof typeof Snitch_adminScalarFieldEnum];
export declare const SupergroupScalarFieldEnum: {
    readonly id: "id";
    readonly supergroup_id: "supergroup_id";
    readonly title: "title";
    readonly username: "username";
    readonly participants_count: "participants_count";
    readonly scam: "scam";
    readonly date: "date";
    readonly region: "region";
    readonly description: "description";
    readonly upd_date: "upd_date";
};
export type SupergroupScalarFieldEnum = (typeof SupergroupScalarFieldEnum)[keyof typeof SupergroupScalarFieldEnum];
export declare const TelegramnotifyScalarFieldEnum: {
    readonly id: "id";
    readonly telegram_id: "telegram_id";
    readonly username: "username";
    readonly timestamp: "timestamp";
};
export type TelegramnotifyScalarFieldEnum = (typeof TelegramnotifyScalarFieldEnum)[keyof typeof TelegramnotifyScalarFieldEnum];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly user_id: "user_id";
    readonly bot: "bot";
    readonly scam: "scam";
    readonly premium: "premium";
    readonly first_name: "first_name";
    readonly last_name: "last_name";
    readonly username: "username";
    readonly phone: "phone";
    readonly upd_date: "upd_date";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const DlImportBatchScalarFieldEnum: {
    readonly id: "id";
    readonly status: "status";
    readonly filesTotal: "filesTotal";
    readonly filesSuccess: "filesSuccess";
    readonly filesFailed: "filesFailed";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type DlImportBatchScalarFieldEnum = (typeof DlImportBatchScalarFieldEnum)[keyof typeof DlImportBatchScalarFieldEnum];
export declare const DlImportFileScalarFieldEnum: {
    readonly id: "id";
    readonly batchId: "batchId";
    readonly originalFileName: "originalFileName";
    readonly fileHash: "fileHash";
    readonly status: "status";
    readonly rowsTotal: "rowsTotal";
    readonly rowsSuccess: "rowsSuccess";
    readonly rowsFailed: "rowsFailed";
    readonly error: "error";
    readonly isActive: "isActive";
    readonly replacedFileId: "replacedFileId";
    readonly createdAt: "createdAt";
    readonly finishedAt: "finishedAt";
    readonly updatedAt: "updatedAt";
};
export type DlImportFileScalarFieldEnum = (typeof DlImportFileScalarFieldEnum)[keyof typeof DlImportFileScalarFieldEnum];
export declare const DlContactScalarFieldEnum: {
    readonly id: "id";
    readonly importFileId: "importFileId";
    readonly telegramId: "telegramId";
    readonly username: "username";
    readonly phone: "phone";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly description: "description";
    readonly region: "region";
    readonly joinedAt: "joinedAt";
    readonly channelsRaw: "channelsRaw";
    readonly fullName: "fullName";
    readonly address: "address";
    readonly vkUrl: "vkUrl";
    readonly email: "email";
    readonly telegramContact: "telegramContact";
    readonly instagram: "instagram";
    readonly viber: "viber";
    readonly odnoklassniki: "odnoklassniki";
    readonly birthDateText: "birthDateText";
    readonly usernameExtra: "usernameExtra";
    readonly geo: "geo";
    readonly sourceRowIndex: "sourceRowIndex";
    readonly createdAt: "createdAt";
};
export type DlContactScalarFieldEnum = (typeof DlContactScalarFieldEnum)[keyof typeof DlContactScalarFieldEnum];
export declare const DlMatchRunScalarFieldEnum: {
    readonly id: "id";
    readonly status: "status";
    readonly contactsTotal: "contactsTotal";
    readonly matchesTotal: "matchesTotal";
    readonly strictMatchesTotal: "strictMatchesTotal";
    readonly usernameMatchesTotal: "usernameMatchesTotal";
    readonly phoneMatchesTotal: "phoneMatchesTotal";
    readonly createdAt: "createdAt";
    readonly finishedAt: "finishedAt";
    readonly error: "error";
};
export type DlMatchRunScalarFieldEnum = (typeof DlMatchRunScalarFieldEnum)[keyof typeof DlMatchRunScalarFieldEnum];
export declare const DlMatchResultScalarFieldEnum: {
    readonly id: "id";
    readonly runId: "runId";
    readonly dlContactId: "dlContactId";
    readonly tgmbaseUserId: "tgmbaseUserId";
    readonly strictTelegramIdMatch: "strictTelegramIdMatch";
    readonly usernameMatch: "usernameMatch";
    readonly phoneMatch: "phoneMatch";
    readonly chatActivityMatch: "chatActivityMatch";
    readonly dlContactSnapshot: "dlContactSnapshot";
    readonly tgmbaseUserSnapshot: "tgmbaseUserSnapshot";
    readonly createdAt: "createdAt";
};
export type DlMatchResultScalarFieldEnum = (typeof DlMatchResultScalarFieldEnum)[keyof typeof DlMatchResultScalarFieldEnum];
export declare const DlMatchResultChatScalarFieldEnum: {
    readonly id: "id";
    readonly resultId: "resultId";
    readonly peerId: "peerId";
    readonly chatType: "chatType";
    readonly title: "title";
    readonly isExcluded: "isExcluded";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type DlMatchResultChatScalarFieldEnum = (typeof DlMatchResultChatScalarFieldEnum)[keyof typeof DlMatchResultChatScalarFieldEnum];
export declare const DlMatchResultMessageScalarFieldEnum: {
    readonly id: "id";
    readonly resultId: "resultId";
    readonly peerId: "peerId";
    readonly messageId: "messageId";
    readonly messageDate: "messageDate";
    readonly text: "text";
    readonly createdAt: "createdAt";
};
export type DlMatchResultMessageScalarFieldEnum = (typeof DlMatchResultMessageScalarFieldEnum)[keyof typeof DlMatchResultMessageScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const JsonNullValueInput: {
    readonly JsonNull: runtime.JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
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
export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>;
export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>;
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>;
export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>;
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
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
    channel?: Prisma.channelOmit;
    group?: Prisma.groupOmit;
    keyword?: Prisma.keywordOmit;
    message?: Prisma.messageOmit;
    snitch_admin?: Prisma.snitch_adminOmit;
    supergroup?: Prisma.supergroupOmit;
    telegramnotify?: Prisma.telegramnotifyOmit;
    user?: Prisma.userOmit;
    dlImportBatch?: Prisma.DlImportBatchOmit;
    dlImportFile?: Prisma.DlImportFileOmit;
    dlContact?: Prisma.DlContactOmit;
    dlMatchRun?: Prisma.DlMatchRunOmit;
    dlMatchResult?: Prisma.DlMatchResultOmit;
    dlMatchResultChat?: Prisma.DlMatchResultChatOmit;
    dlMatchResultMessage?: Prisma.DlMatchResultMessageOmit;
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
