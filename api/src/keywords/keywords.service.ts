import { Inject, Injectable } from '@nestjs/common';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
} from './interfaces/keyword.interface.js';
import type { IKeywordsRepository } from './interfaces/keywords-repository.interface.js';
import { KeywordsMatchesService } from './services/keywords-matches.service.js';

/**
 * Сервис для управления ключевыми словами
 *
 * Обеспечивает CRUD операции с ключевыми словами,
 * массовое добавление и пересчет совпадений в комментариях.
 */
@Injectable()
export class KeywordsService {
  constructor(
    @Inject('IKeywordsRepository')
    private readonly repository: IKeywordsRepository,
    private readonly matchesService: KeywordsMatchesService,
  ) {}

  /**
   * Добавляет новое ключевое слово
   *
   * @param word - Ключевое слово (будет нормализовано в lowercase)
   * @param category - Категория ключевого слова (опционально)
   * @param isPhrase - Флаг, что это фраза, а не отдельное слово
   * @returns Созданное или обновленное ключевое слово
   * @throws Error если слово пустое
   */
  async addKeyword(
    word: string,
    category?: string,
    isPhrase?: boolean,
  ): Promise<IKeywordResponse> {
    const normalizedWord = word.trim().toLowerCase();
    const normalizedCategory = category?.trim() ?? null;

    if (!normalizedWord) {
      throw new Error('Keyword cannot be empty');
    }

    let existing: { id: number; word: string; isPhrase: boolean } | null = null;
    try {
      existing = (await this.repository.findUnique({
        word: normalizedWord,
      })) as { id: number; word: string; isPhrase: boolean } | null;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2025'
      ) {
        existing = null;
      } else {
        throw error;
      }
    }

    if (existing) {
      const updated = (await this.repository.update(
        { id: (existing as { id: number }).id },
        {
          category: normalizedCategory,
          isPhrase:
            isPhrase ?? (existing as { isPhrase: boolean }).isPhrase ?? false,
        },
      )) as IKeywordResponse;
      return updated;
    }

    const created = (await this.repository.create({
      word: normalizedWord,
      category: normalizedCategory,
      isPhrase: isPhrase ?? false,
    })) as IKeywordResponse;

    return created;
  }

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    const entries = words.map((word) => ({
      word: word.trim(),
      category: null,
    }));
    return this.bulkAddKeywordEntries(entries);
  }

  async addKeywordsFromFile(fileContent: string): Promise<IBulkAddResponse> {
    const entries = fileContent
      .split('\n')
      .map((line) => {
        const parts = line.split(';').map((p) => p.trim());
        if (parts.length === 0 || !parts[0]) {
          return null;
        }

        if (parts.length === 1) {
          return { word: parts[0] };
        }

        return { word: parts[0], category: parts[1] };
      })
      .filter(
        (entry): entry is { word: string; category?: string } => entry !== null,
      );

    return this.bulkAddKeywordEntries(entries);
  }

  private async bulkAddKeywordEntries(
    entries: { word: string; category?: string | null }[],
  ): Promise<IBulkAddResponse> {
    const success: IKeywordResponse[] = [];
    const failed: { word: string; error: string }[] = [];

    const normalizedWords = Array.from(
      new Set(
        entries
          .map((entry) => entry.word?.trim().toLowerCase())
          .filter((word): word is string => Boolean(word)),
      ),
    );

    const existingKeywords = normalizedWords.length
      ? ((await this.repository.findMany({
          word: { in: normalizedWords },
        })) ?? [])
      : [];

    const existedBeforeImport = new Set<string>(
      existingKeywords.map((keyword) => (keyword as { word: string }).word),
    );
    const processedInBatch = new Set<string>();

    let createdCount = 0;
    let updatedCount = 0;

    for (const { word, category } of entries) {
      const normalizedWord = word.trim().toLowerCase();

      try {
        const keyword = await this.addKeyword(word, category ?? undefined);
        success.push(keyword);

        if (
          existedBeforeImport.has(normalizedWord) ||
          processedInBatch.has(normalizedWord)
        ) {
          updatedCount += 1;
        } else {
          createdCount += 1;
        }

        processedInBatch.add(normalizedWord);
      } catch (error) {
        failed.push({
          word,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success,
      failed,
      stats: {
        total: entries.length,
        success: success.length,
        failed: failed.length,
        created: createdCount,
        updated: updatedCount,
      },
    };
  }

  async deleteKeyword(id: number): Promise<IDeleteResponse> {
    await this.repository.delete({ id });
    return { success: true, id };
  }

  async deleteAllKeywords(): Promise<IDeleteResponse> {
    const result = await this.repository.deleteMany();
    return { success: true, count: result.count };
  }

  async getAllKeywords(): Promise<{
    keywords: IKeywordResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.getKeywords();
  }

  async getKeywords(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    keywords: IKeywordResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;
    const search = options?.search;
    const orderBy = { word: 'asc' as const };

    const where = search
      ? {
          OR: [
            { word: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [keywords, total] = await Promise.all([
      this.repository.findMany(where, orderBy, skip, limit),
      this.repository.count(where),
    ]);

    return {
      keywords,
      total,
      page,
      limit,
    };
  }

  async getKeywordWords(): Promise<string[]> {
    const keywords = await this.repository.findManyWithSelect({
      id: true,
      word: true,
      isPhrase: true,
    });

    const normalized = keywords
      .map((keyword) => keyword.word.trim())
      .filter((value) => value.length > 0);

    return Array.from(new Set(normalized));
  }

  async recalculateKeywordMatches(): Promise<{
    processed: number;
    updated: number;
    created: number;
    deleted: number;
  }> {
    return this.matchesService.recalculateKeywordMatches();
  }
}
