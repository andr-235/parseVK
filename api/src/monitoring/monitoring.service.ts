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

    const items: MonitorMessageDto[] = rows.map((row) => ({
      id:
        typeof row.id === 'bigint'
          ? row.id.toString()
          : (row.id as string | number),
      text: row.text ?? null,
      createdAt: normalizeDate(row.createdAt ?? null),
      author: row.author ?? null,
      chat: row.chat ?? null,
    }));

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
