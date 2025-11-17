import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
} from './interfaces/keyword.interface';
import { generateAllWordForms } from '../common/utils/russian-nouns.util';

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

  async recalculateKeywordMatches(): Promise<{
    processed: number;
    updated: number;
    created: number;
    deleted: number;
  }> {
    const NBSP_REGEX = /\u00a0/g;
    const SOFT_HYPHEN_REGEX = /\u00ad/g;
    const INVISIBLE_SPACE_REGEX = /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g;
    const WHITESPACE_REGEX = /\s+/g;

    const normalizeForKeywordMatch = (value: string | null | undefined): string => {
      if (!value) {
        return '';
      }

      return value
        .toLowerCase()
        .replace(NBSP_REGEX, ' ')
        .replace(INVISIBLE_SPACE_REGEX, ' ')
        .replace(SOFT_HYPHEN_REGEX, '')
        .replace(/ё/g, 'е')
        .replace(WHITESPACE_REGEX, ' ')
        .trim();
    };

    const keywords = await this.prisma.keyword.findMany({
      select: { id: true, word: true },
    });

    const keywordCandidates = keywords
      .map((keyword) => {
        const forms = generateAllWordForms(keyword.word);
        return {
          id: keyword.id,
          normalizedForms: forms,
        };
      })
      .filter((keyword) => keyword.normalizedForms.length > 0);

    const totalComments = await this.prisma.comment.count();
    const batchSize = 1000;
    let processed = 0;
    let updated = 0;
    let created = 0;
    let deleted = 0;

    for (let offset = 0; offset < totalComments; offset += batchSize) {
      const comments = await this.prisma.comment.findMany({
        select: { id: true, text: true },
        skip: offset,
        take: batchSize,
      });

      for (const comment of comments) {
        const normalizedText = normalizeForKeywordMatch(comment.text);

        if (!normalizedText) {
          await this.prisma.commentKeywordMatch.deleteMany({ where: { commentId: comment.id } });
          processed++;
          continue;
        }

        const matchedKeywordIds = new Set(
          keywordCandidates
            .filter((keyword) =>
              keyword.normalizedForms.some((form) => normalizedText.includes(form)),
            )
            .map((keyword) => keyword.id),
        );

        const existingMatches = await this.prisma.commentKeywordMatch.findMany({
          where: { commentId: comment.id },
          select: { keywordId: true },
        });

        const existingKeywordIds = new Set(
          existingMatches.map((match) => match.keywordId),
        );

        const toCreate = Array.from(matchedKeywordIds).filter(
          (keywordId) => !existingKeywordIds.has(keywordId),
        );
        const toDelete = Array.from(existingKeywordIds).filter(
          (keywordId) => !matchedKeywordIds.has(keywordId),
        );

        if (toCreate.length > 0 || toDelete.length > 0) {
          if (toDelete.length > 0) {
            await this.prisma.commentKeywordMatch.deleteMany({
              where: {
                commentId: comment.id,
                keywordId: { in: toDelete },
              },
            });
            deleted += toDelete.length;
          }

          if (toCreate.length > 0) {
            await this.prisma.commentKeywordMatch.createMany({
              data: toCreate.map((keywordId) => ({ commentId: comment.id, keywordId })),
              skipDuplicates: true,
            });
            created += toCreate.length;
          }

          updated++;
        }

        processed++;
      }
    }

    return { processed, updated, created, deleted };
  }
}
