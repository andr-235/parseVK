import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace.js";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.Subset<Options, Prisma.PrismaClientOptions>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = undefined, in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    $connect(): runtime.Types.Utils.JsPromise<void>;
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    get channel(): Prisma.channelDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get group(): Prisma.groupDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get keyword(): Prisma.keywordDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get message(): Prisma.messageDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get snitch_admin(): Prisma.snitch_adminDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get supergroup(): Prisma.supergroupDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get telegramnotify(): Prisma.telegramnotifyDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get user(): Prisma.userDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get dlImportBatch(): Prisma.DlImportBatchDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get dlImportFile(): Prisma.DlImportFileDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get dlContact(): Prisma.DlContactDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get dlMatchRun(): Prisma.DlMatchRunDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get dlMatchResult(): Prisma.DlMatchResultDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get dlMatchResultChat(): Prisma.DlMatchResultChatDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get dlMatchResultMessage(): Prisma.DlMatchResultMessageDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
