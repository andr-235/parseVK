import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
} from './interfaces/keyword.interface';

@Injectable()
export class KeywordsService {
  constructor(private prisma: PrismaService) {}

  async addKeyword(word: string, category?: string): Promise<IKeywordResponse> {
    const normalizedWord = word.trim().toLowerCase();
    const normalizedCategory = category?.trim() ?? null;

    return this.prisma.keyword.upsert({
      where: { word: normalizedWord },
      update:
        normalizedCategory !== null ? { category: normalizedCategory } : {},
      create: { word: normalizedWord, category: normalizedCategory },
    });
  }

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    const entries = words.map((word) => ({ word }));
    return this.bulkAddKeywordEntries(entries);
  }

  async addKeywordsFromFile(fileContent: string): Promise<IBulkAddResponse> {
    const entries = fileContent
      .split('\n')
      .map((line) => line.replace(/\r/g, '').trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const separator = line.includes(';') ? ';' : ',';
        const parts = line
          .split(separator)
          .map((part) => part.trim())
          .filter(Boolean);

        if (parts.length === 0) {
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
      ? ((await this.prisma.keyword.findMany({
          where: { word: { in: normalizedWords } },
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
      total: entries.length,
      successCount: success.length,
      failedCount: failed.length,
      createdCount,
      updatedCount,
    };
  }

  async getAllKeywords(): Promise<IKeywordResponse[]> {
    return this.prisma.keyword.findMany({
      orderBy: { word: 'asc' },
    });
  }

  async deleteKeyword(id: number): Promise<IKeywordResponse> {
    return this.prisma.keyword.delete({
      where: { id },
    });
  }

  async deleteAllKeywords(): Promise<IDeleteResponse> {
    return this.prisma.keyword.deleteMany({});
  }
}
