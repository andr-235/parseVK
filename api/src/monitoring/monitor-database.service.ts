import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import type { AppConfig } from '../config/app.config';

const IDENTIFIER_PATTERN =
  /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;

export type MonitorMessageRow = {
  id: unknown;
  text: string | null;
  createdAt: Date | string | null;
  author?: string | null;
  chat?: string | null;
  source?: string | null;
  metadata?: unknown;
};

@Injectable()
export class MonitorDatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient | null = null;
  private readonly logger = new Logger(MonitorDatabaseService.name);
  private readonly databaseUrl?: string;
  private readonly tableNames: string[];
  private readonly idColumn: string;
  private readonly textColumn: string;
  private readonly createdAtColumn: string;
  private readonly authorColumn?: string;
  private readonly chatColumn?: string;
  private readonly metadataColumn?: string;
  private readonly keywordsTableName?: string;
  private readonly keywordWordColumn?: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    this.databaseUrl = configService.get('monitorDatabaseUrl', { infer: true });

    const rawTables =
      configService.get('monitorMessagesTable', { infer: true }) ?? 'messages';
    this.tableNames = this.normalizeIdentifierList(
      rawTables,
      'MONITOR_MESSAGES_TABLE',
    );
    this.idColumn = this.normalizeIdentifier(
      configService.get('monitorMessageIdColumn', { infer: true }) ?? 'id',
      'MONITOR_MESSAGE_ID_COLUMN',
    );
    this.textColumn = this.normalizeIdentifier(
      configService.get('monitorMessageTextColumn', { infer: true }) ?? 'text',
      'MONITOR_MESSAGE_TEXT_COLUMN',
    );
    this.createdAtColumn = this.normalizeIdentifier(
      configService.get('monitorMessageCreatedAtColumn', { infer: true }) ??
        'created_at',
      'MONITOR_MESSAGE_CREATED_AT_COLUMN',
    );

    const authorColumn = configService.get('monitorMessageAuthorColumn', {
      infer: true,
    });
    this.authorColumn = authorColumn
      ? this.normalizeIdentifier(authorColumn, 'MONITOR_MESSAGE_AUTHOR_COLUMN')
      : undefined;

    const chatColumn = configService.get('monitorMessageChatColumn', {
      infer: true,
    });
    this.chatColumn = chatColumn
      ? this.normalizeIdentifier(chatColumn, 'MONITOR_MESSAGE_CHAT_COLUMN')
      : undefined;

    const metadataColumn = configService.get('monitorMessageMetadataColumn', {
      infer: true,
    });
    this.metadataColumn = metadataColumn
      ? this.normalizeIdentifier(
          metadataColumn,
          'MONITOR_MESSAGE_METADATA_COLUMN',
        )
      : undefined;

    const keywordsTable = configService.get('monitorKeywordsTable', {
      infer: true,
    });
    if (keywordsTable) {
      this.keywordsTableName = this.normalizeIdentifier(
        keywordsTable,
        'MONITOR_KEYWORDS_TABLE',
      );
      const keywordWordColumn =
        configService.get('monitorKeywordWordColumn', { infer: true }) ??
        'word';
      this.keywordWordColumn = this.normalizeIdentifier(
        keywordWordColumn,
        'MONITOR_KEYWORD_WORD_COLUMN',
      );
    }
  }

  get isReady(): boolean {
    return Boolean(this.client);
  }

  async onModuleInit(): Promise<void> {
    if (!this.databaseUrl) {
      this.logger.warn(
        'MONITOR_DATABASE_URL не задан — мониторинг сообщений отключен',
      );
      return;
    }

    this.client = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
    });

    try {
      await this.client.$connect();
      this.logger.log('MONITOR_DATABASE_URL настроен');
    } catch (error) {
      this.logger.error(
        'Не удалось подключиться к базе мониторинга. Проверьте MONITOR_DATABASE_URL.',
        error instanceof Error ? error.stack : undefined,
      );
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.$disconnect();
  }

  async findMessages(params: {
    keywords: string[];
    limit: number;
    offset?: number;
    from?: Date;
  }): Promise<MonitorMessageRow[]> {
    if (!this.client) {
      throw new Error('Monitoring database is not configured.');
    }

    if (params.keywords.length === 0) {
      return [];
    }

    const values: Array<string | number | Date> = [];
    const conditions: string[] = [];

    const rawTableNames = this.tableNames;
    const tableNames = rawTableNames.map((table) =>
      this.formatIdentifier(table),
    );
    const idColumn = this.formatIdentifier(this.idColumn);
    const textColumn = this.formatIdentifier(this.textColumn);
    const createdAtColumn = this.formatIdentifier(this.createdAtColumn);
    const authorColumn = this.authorColumn
      ? this.formatIdentifier(this.authorColumn)
      : undefined;
    const chatColumn = this.chatColumn
      ? this.formatIdentifier(this.chatColumn)
      : undefined;
    const metadataColumn = this.metadataColumn
      ? this.formatIdentifier(this.metadataColumn)
      : undefined;

    params.keywords.forEach((keyword) => {
      values.push(`%${keyword}%`);
      conditions.push(`${textColumn} ILIKE $${values.length}`);
    });

    const offsetIndex = values.length + 1;
    values.push(Math.max(params.offset ?? 0, 0));

    const limitIndex = values.length + 1;
    values.push(params.limit);

    const selectColumns = [
      `${idColumn} as id`,
      `${textColumn} as text`,
      `${createdAtColumn} as "createdAt"`,
    ];

    if (authorColumn) {
      selectColumns.push(`${authorColumn} as author`);
    }

    if (chatColumn) {
      selectColumns.push(`${chatColumn} as chat`);
    }

    if (metadataColumn) {
      selectColumns.push(`${metadataColumn} as metadata`);
    }

    const whereParts = [`${textColumn} IS NOT NULL`];
    if (conditions.length > 0) {
      whereParts.push(`(${conditions.join(' OR ')})`);
    }
    if (params.from) {
      values.push(params.from);
      whereParts.push(`${createdAtColumn} >= $${values.length}`);
    }

    const baseSelect = (tableName: string, sourceName: string) => {
      const safeSource = sourceName.replace(/'/g, "''");
      return `SELECT ${selectColumns.join(', ')}, '${safeSource}' as source FROM ${tableName} WHERE ${whereParts.join(
        ' AND ',
      )}`;
    };

    const query =
      tableNames.length === 1
        ? `${baseSelect(tableNames[0], this.getSourceName(rawTableNames[0]))} ORDER BY ${createdAtColumn} DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`
        : `SELECT * FROM (${tableNames
            .map((tableName, index) =>
              baseSelect(tableName, this.getSourceName(rawTableNames[index])),
            )
            .join(
              ' UNION ALL ',
            )}) AS combined ORDER BY "createdAt" DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

    return this.client.$queryRawUnsafe<MonitorMessageRow[]>(query, ...values);
  }

  async findKeywords(): Promise<string[] | null> {
    if (!this.client) {
      throw new Error('Monitoring database is not configured.');
    }

    if (!this.keywordsTableName || !this.keywordWordColumn) {
      return null;
    }

    const tableName = this.formatIdentifier(this.keywordsTableName);
    const wordColumn = this.formatIdentifier(this.keywordWordColumn);
    const query = `SELECT ${wordColumn}::text as word FROM ${tableName} WHERE ${wordColumn} IS NOT NULL`;
    const rows =
      await this.client.$queryRawUnsafe<Array<{ word: string | null }>>(query);

    const normalized = rows
      .map((row) => (row.word ?? '').trim())
      .filter((value) => value.length > 0);

    return Array.from(new Set(normalized));
  }

  private normalizeIdentifier(value: string, label: string): string {
    const trimmed = value.trim();
    if (!IDENTIFIER_PATTERN.test(trimmed)) {
      throw new Error(`Некорректное значение ${label}.`);
    }
    return trimmed;
  }

  private normalizeIdentifierList(value: string, label: string): string[] {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) {
      throw new Error(`Некорректное значение ${label}.`);
    }

    return items.map((item) => this.normalizeIdentifier(item, label));
  }

  private formatIdentifier(identifier: string): string {
    return identifier
      .split('.')
      .map((part) => `"${part}"`)
      .join('.');
  }

  private getSourceName(tableName: string): string {
    const parts = tableName.split('.');
    return parts[parts.length - 1] ?? tableName;
  }
}
