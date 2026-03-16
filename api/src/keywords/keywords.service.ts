import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
  IKeywordFormsResponse,
} from './interfaces/keyword.interface.js';
import type { IKeywordsRepository } from './interfaces/keywords-repository.interface.js';
import {
  KeywordFormSource,
  type KeywordForm,
} from '../generated/prisma/client.js';
import { normalizeForKeywordMatch } from '../common/utils/keyword-normalization.utils.js';
import { KeywordFormsService } from './services/keyword-forms.service.js';
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
    private readonly formsService: KeywordFormsService,
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
      await this.formsService.syncGeneratedForms(
        updated.id,
        updated.word,
        updated.isPhrase,
      );
      return updated;
    }

    const created = (await this.repository.create({
      word: normalizedWord,
      category: normalizedCategory,
      isPhrase: isPhrase ?? false,
    })) as IKeywordResponse;

    await this.formsService.syncGeneratedForms(
      created.id,
      created.word,
      created.isPhrase,
    );

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

  async getKeywordForms(id: number): Promise<IKeywordFormsResponse> {
    const keyword = await this.repository.findUniqueWithForms({ id });

    return {
      keywordId: keyword.id,
      word: keyword.word,
      isPhrase: keyword.isPhrase,
      generatedForms: this.collectFormsBySource(
        keyword.keywordForms,
        KeywordFormSource.generated,
      ),
      manualForms: this.collectFormsBySource(
        keyword.keywordForms,
        KeywordFormSource.manual,
      ),
      exclusions: Array.from(
        new Set(keyword.keywordFormExclusions.map((item) => item.form)),
      ).sort((left, right) => left.localeCompare(right, 'ru')),
    };
  }

  async addManualKeywordForm(
    id: number,
    form: string,
  ): Promise<IKeywordFormsResponse> {
    const keyword = await this.repository.findUniqueWithForms({ id });
    this.ensureSingleWordKeyword(keyword.isPhrase);
    this.ensureNormalizedForm(form);

    await this.formsService.addManualForm(id, form);
    await this.matchesService.recalculateKeywordMatchesForKeyword(id);

    return this.getKeywordForms(id);
  }

  async removeManualKeywordForm(
    id: number,
    form: string,
  ): Promise<IKeywordFormsResponse> {
    const keyword = await this.repository.findUniqueWithForms({ id });
    this.ensureSingleWordKeyword(keyword.isPhrase);
    this.ensureNormalizedForm(form);

    await this.formsService.removeManualForm(id, form);
    await this.matchesService.recalculateKeywordMatchesForKeyword(id);

    return this.getKeywordForms(id);
  }

  async addKeywordFormExclusion(
    id: number,
    form: string,
  ): Promise<IKeywordFormsResponse> {
    const keyword = await this.repository.findUniqueWithForms({ id });
    this.ensureSingleWordKeyword(keyword.isPhrase);
    this.ensureNormalizedForm(form);

    await this.formsService.excludeGeneratedForm(id, form);
    await this.formsService.syncGeneratedForms(id, keyword.word, keyword.isPhrase);
    await this.matchesService.recalculateKeywordMatchesForKeyword(id);

    return this.getKeywordForms(id);
  }

  async removeKeywordFormExclusion(
    id: number,
    form: string,
  ): Promise<IKeywordFormsResponse> {
    const keyword = await this.repository.findUniqueWithForms({ id });
    this.ensureSingleWordKeyword(keyword.isPhrase);
    this.ensureNormalizedForm(form);

    await this.formsService.removeGeneratedFormExclusion(id, form);
    await this.formsService.syncGeneratedForms(id, keyword.word, keyword.isPhrase);
    await this.matchesService.recalculateKeywordMatchesForKeyword(id);

    return this.getKeywordForms(id);
  }

  async recalculateKeywordMatches(): Promise<{
    processed: number;
    updated: number;
    created: number;
    deleted: number;
  }> {
    return this.matchesService.recalculateKeywordMatches();
  }

  private ensureSingleWordKeyword(isPhrase: boolean): void {
    if (isPhrase) {
      throw new BadRequestException(
        'Manual forms and exclusions are available only for single-word keywords',
      );
    }
  }

  private ensureNormalizedForm(form: string): string {
    const normalizedForm = normalizeForKeywordMatch(form);
    if (!normalizedForm) {
      throw new BadRequestException('Keyword form cannot be empty');
    }

    return normalizedForm;
  }

  private collectFormsBySource(
    forms: KeywordForm[],
    source: KeywordFormSource,
  ): string[] {
    return Array.from(
      new Set(
        forms
          .filter((form) => form.source === source)
          .map((form) => form.form),
      ),
    ).sort((left, right) => left.localeCompare(right, 'ru'));
  }
}
