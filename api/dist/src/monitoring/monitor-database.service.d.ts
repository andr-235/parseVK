import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/app.config.js';
export type MonitorMessageRow = {
    id: unknown;
    text: string | null;
    createdAt: Date | string | null;
    author?: string | null;
    chat?: string | null;
    source?: string | null;
    metadata?: unknown;
};
export declare class MonitorDatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private client;
    private readonly logger;
    private readonly databaseUrl?;
    private readonly tableNames;
    private readonly idColumn;
    private readonly textColumn;
    private readonly createdAtColumn;
    private readonly authorColumn?;
    private readonly chatColumn?;
    private readonly metadataColumn?;
    private readonly groupsTableName?;
    private readonly groupChatIdColumn?;
    private readonly groupNameColumn?;
    private readonly keywordsTableName?;
    private readonly keywordWordColumn?;
    constructor(configService: ConfigService<AppConfig>);
    get isReady(): boolean;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    findMessages(params: {
        keywords: string[];
        limit: number;
        offset?: number;
        from?: Date;
        sources?: string[];
    }): Promise<MonitorMessageRow[]>;
    findGroups(params?: {
        sources?: string[];
    }): Promise<Array<{
        chatId: string;
        name: string;
    }> | null>;
    private findGroupsFromMessages;
    private normalizeGroups;
    private buildCoalescedExpression;
    findKeywords(): Promise<string[] | null>;
    private normalizeIdentifier;
    private resolveSourceTables;
    private normalizeIdentifierList;
    private formatIdentifier;
    private getSourceName;
}
