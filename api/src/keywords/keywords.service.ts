import { Inject, Injectable } from '@nestjs/common';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
} from './interfaces/keyword.interface';
import type { IKeywordsRepository } from './interfaces/keywords-repository.interface';
import { KeywordsMatchesService } from './services/keywords-matches.service';

@Injectable()
export class KeywordsService {
  constructor(
    @Inject('IKeywordsRepository')
    private readonly repository: IKeywordsRepository,
    private readonly matchesService: KeywordsMatchesService,
  ) {}

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

    const existing = await this.repository.findUnique({
      word: normalizedWord,
    });

    if (existing) {
      const updated = await this.repository.update(
        { id: existing.id },
        {
          category: normalizedCategory,
          isPhrase: isPhrase ?? existing.isPhrase ?? false,
        },
      );
      return updated;
    }

    const created = await this.repository.create({
      word: normalizedWord,
      category: normalizedCategory,
      isPhrase: isPhrase ?? false,
    });

    return created;
  }

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    const entries = words.map((word) => ({ word: word.trim(), category: null }));
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

    const existedBeforeImport = new Set(
      existingKeywords.map((keyword) => keyword.word),
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

  async getAllKeywords(): Promise<IKeywordResponse[]> {
    return this.getKeywords();
  }

  async getKeywords(search?: string): Promise<IKeywordResponse[]> {
    const orderBy = { word: 'asc' as const };
    if (search) {
      return this.repository.findMany(
        {
          OR: [
            { word: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy,
      );
    }

    return this.repository.findMany(undefined, orderBy);
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
