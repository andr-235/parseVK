import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { KeywordsService } from '../keywords/keywords.service';
import { MonitorDatabaseService } from './monitor-database.service';
import type { MonitorMessagesDto } from './dto/monitor-messages.dto';
import type { MonitorMessageDto } from './dto/monitor-message.dto';

const normalizeKeywords = (values: string[]): string[] => {
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
};

const normalizeDate = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getStringValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  if (value.trim().length === 0) {
    return null;
  }
  return value;
};

const pickStringValue = (...values: unknown[]): string | null => {
  for (const value of values) {
    const resolved = getStringValue(value);
    if (resolved) {
      return resolved;
    }
  }
  return null;
};

const parseMetadata = (value: unknown): Record<string, unknown> | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isRecord(value) ? value : null;
};

const extractMetadata = (
  value: unknown,
): { text: string | null; url: string | null; type: string | null } => {
  const metadata = parseMetadata(value);
  if (!metadata) {
    return { text: null, url: null, type: null };
  }

  const raw = isRecord(metadata.raw) ? metadata.raw : null;
  const rawS3 = raw && isRecord(raw.s3Info) ? raw.s3Info : null;

  const text = pickStringValue(
    raw?.body,
    raw?.caption,
    raw?.text,
    metadata.text,
  );
  const url = pickStringValue(
    rawS3?.url,
    rawS3?.link,
    raw?.file_url,
    raw?.fileUrl,
    raw?.url,
    metadata.url,
  );
  const type = pickStringValue(raw?.mimetype, raw?.type, metadata.type);

  return { text, url, type };
};

@Injectable()
export class MonitoringService {
  constructor(
    private readonly monitorDb: MonitorDatabaseService,
    private readonly keywordsService: KeywordsService,
  ) {}

  async getMessages(options: {
    keywords?: string[];
    limit: number;
  }): Promise<MonitorMessagesDto> {
    if (!this.monitorDb.isReady) {
      throw new ServiceUnavailableException(
        'Мониторинг недоступен: MONITOR_DATABASE_URL не настроен.',
      );
    }

    const keywords = options.keywords?.length
      ? normalizeKeywords(options.keywords)
      : await this.getDefaultKeywords();

    if (keywords.length === 0) {
      return {
        items: [],
        total: 0,
        usedKeywords: [],
        lastSyncAt: new Date().toISOString(),
      };
    }

    const rows = await this.monitorDb.findMessages({
      keywords,
      limit: options.limit,
    });

    const items: MonitorMessageDto[] = rows.map((row) => {
      const metadata = extractMetadata(row.metadata);
      const text = getStringValue(row.text) ?? metadata.text ?? null;

      return {
        id:
          typeof row.id === 'bigint'
            ? row.id.toString()
            : (row.id as string | number),
        text,
        createdAt: normalizeDate(row.createdAt ?? null),
        author: row.author ?? null,
        chat: row.chat ?? null,
        source: row.source ?? null,
        contentUrl: metadata.url ?? null,
        contentType: metadata.type ?? null,
      };
    });

    return {
      items,
      total: items.length,
      usedKeywords: keywords,
      lastSyncAt: new Date().toISOString(),
    };
  }

  private async getDefaultKeywords(): Promise<string[]> {
    const monitorKeywords = await this.monitorDb.findKeywords();
    if (monitorKeywords !== null) {
      return normalizeKeywords(monitorKeywords);
    }

    return this.keywordsService.getKeywordWords();
  }
}
