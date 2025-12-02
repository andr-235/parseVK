import { Injectable } from '@nestjs/common';
import { MatchSource } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
} from './interfaces/keyword.interface';

// Определяем символы, которые считаются частью слова (латиница, кириллица, цифры, подчеркивание)
const WORD_CHARS_PATTERN = '[a-zA-Z0-9_\\u0400-\\u04FF]';
const WORD_CHAR_TEST = new RegExp(WORD_CHARS_PATTERN);

@Injectable()
export class KeywordsService {
  constructor(private prisma: PrismaService) {}

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

    const existing = await this.prisma.keyword.findUnique({
      where: { word: normalizedWord },
    });

    if (existing) {
      const updated = await this.prisma.keyword.update({
        where: { id: existing.id },
        data: {
          category: normalizedCategory,
          isPhrase: isPhrase ?? existing.isPhrase,
        },
      });
      return updated;
    }

    const created = await this.prisma.keyword.create({
      data: {
        word: normalizedWord,
        category: normalizedCategory,
        isPhrase: isPhrase ?? false,
      },
    });

    return created;
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
    await this.prisma.keyword.delete({ where: { id } });
    return { success: true, id };
  }

  async getKeywords(search?: string): Promise<IKeywordResponse[]> {
    if (search) {
      return this.prisma.keyword.findMany({
        where: {
          OR: [
            { word: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy: { word: 'asc' },
      });
    }

    return this.prisma.keyword.findMany({
      orderBy: { word: 'asc' },
    });
  }

  async recalculateKeywordMatches(): Promise<{
    processed: number;
    updated: number;
    created: number;
    deleted: number;
  }> {
    const NBSP_REGEX = /\u00a0/g;
    const SOFT_HYPHEN_REGEX = /\u00ad/g;
    const INVISIBLE_SPACE_REGEX =
      /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g;
    const WHITESPACE_REGEX = /\s+/g;

    const normalizeForKeywordMatch = (
      value: string | null | undefined,
    ): string => {
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

    const escapeRegExp = (value: string): string => {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    interface KeywordCandidate {
      id: number;
      normalizedWord: string;
      isPhrase: boolean;
    }

    const matchesKeyword = (
      text: string,
      keyword: KeywordCandidate,
    ): boolean => {
      const escaped = escapeRegExp(keyword.normalizedWord);
      
      const startsWithWordChar = WORD_CHAR_TEST.test(keyword.normalizedWord[0]);
      const endsWithWordChar = WORD_CHAR_TEST.test(
        keyword.normalizedWord[keyword.normalizedWord.length - 1],
      );

      const boundaryStart = startsWithWordChar
        ? `(?<!${WORD_CHARS_PATTERN})`
        : '';
      const boundaryEnd = endsWithWordChar
        ? `(?!${WORD_CHARS_PATTERN})`
        : '';

      if (keyword.isPhrase) {
        const pattern = `${boundaryStart}${escaped}${boundaryEnd}`;
        const regex = new RegExp(pattern, 'i');
        return regex.test(text);
      } else {
        const pattern = `${boundaryStart}${escaped}`;
        const regex = new RegExp(pattern, 'i');
        return regex.test(text);
      }
    };

    const keywords = await this.prisma.keyword.findMany({
      select: { id: true, word: true, isPhrase: true },
    });

    const keywordCandidates: KeywordCandidate[] = keywords
      .map((keyword) => {
        const normalized = normalizeForKeywordMatch(keyword.word);
        return {
          id: keyword.id,
          normalizedWord: normalized,
          isPhrase: keyword.isPhrase,
        };
      })
      .filter((keyword) => keyword.normalizedWord.length > 0);

    const totalComments = await this.prisma.comment.count();
    const totalPosts = await this.prisma.post.count();
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
          await this.prisma.commentKeywordMatch.deleteMany({
            where: { commentId: comment.id, source: MatchSource.COMMENT },
          });
          processed++;
          continue;
        }

        const matchedKeywordIds = new Set(
          keywordCandidates
            .filter((keyword) => matchesKeyword(normalizedText, keyword))
            .map((keyword) => keyword.id),
        );

        const existingMatches = await this.prisma.commentKeywordMatch.findMany({
          where: { commentId: comment.id, source: MatchSource.COMMENT },
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
                source: MatchSource.COMMENT,
                keywordId: { in: toDelete },
              },
            });
            deleted += toDelete.length;
          }

          if (toCreate.length > 0) {
            await this.prisma.commentKeywordMatch.createMany({
              data: toCreate.map((keywordId) => ({
                commentId: comment.id,
                keywordId,
                source: MatchSource.COMMENT,
              })),
              skipDuplicates: true,
            });
            created += toCreate.length;
          }

          updated++;
        }

        processed++;
      }
    }

    for (let offset = 0; offset < totalPosts; offset += batchSize) {
      const posts = await this.prisma.post.findMany({
        select: { id: true, ownerId: true, vkPostId: true, text: true },
        skip: offset,
        take: batchSize,
      });

      for (const post of posts) {
        if (!post.text) continue;

        const normalizedText = normalizeForKeywordMatch(post.text);

        if (!normalizedText) {
          continue;
        }

        const matchedKeywordIds = new Set(
          keywordCandidates
            .filter((keyword) => matchesKeyword(normalizedText, keyword))
            .map((keyword) => keyword.id),
        );

        const comments = await this.prisma.comment.findMany({
          where: { ownerId: post.ownerId, postId: post.vkPostId },
          select: { id: true },
        });

        if (comments.length === 0) {
          continue;
        }

        const commentIds = comments.map((c) => c.id);

        const existingMatches = await this.prisma.commentKeywordMatch.findMany({
          where: {
            commentId: { in: commentIds },
            source: MatchSource.POST,
          },
          select: { commentId: true, keywordId: true },
        });

        const existingKeys = new Set(
          existingMatches.map((m) => `${m.commentId}-${m.keywordId}`),
        );

        const toCreate: Array<{ commentId: number; keywordId: number }> = [];

        for (const commentId of commentIds) {
          for (const keywordId of matchedKeywordIds) {
            const key = `${commentId}-${keywordId}`;
            if (!existingKeys.has(key)) {
              toCreate.push({ commentId, keywordId });
            }
          }
        }

        const toDelete: Array<{ commentId: number; keywordId: number }> = [];

        for (const match of existingMatches) {
          if (!matchedKeywordIds.has(match.keywordId)) {
            toDelete.push({ commentId: match.commentId, keywordId: match.keywordId });
          }
        }

        if (toCreate.length > 0 || toDelete.length > 0) {
          if (toDelete.length > 0) {
            for (const { commentId, keywordId } of toDelete) {
              await this.prisma.commentKeywordMatch.deleteMany({
                where: {
                  commentId,
                  keywordId,
                  source: MatchSource.POST,
                },
              });
            }
            deleted += toDelete.length;
          }

          if (toCreate.length > 0) {
            await this.prisma.commentKeywordMatch.createMany({
              data: toCreate.map(({ commentId, keywordId }) => ({
                commentId,
                keywordId,
                source: MatchSource.POST,
              })),
              skipDuplicates: true,
            });
            created += toCreate.length;
          }

          updated++;
        }
      }
    }

    return { processed, updated, created, deleted };
  }
}
