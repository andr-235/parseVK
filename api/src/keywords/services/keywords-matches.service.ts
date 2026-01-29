import { Inject, Injectable } from '@nestjs/common';
import { MatchSource } from '../../common/types/match-source.enum.js';
import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface.js';

const WORD_CHARS_PATTERN = '[a-zA-Z0-9_\\u0400-\\u04FF]';
const WORD_CHAR_TEST = new RegExp(WORD_CHARS_PATTERN);

interface KeywordCandidate {
  id: number;
  normalizedWord: string;
  isPhrase: boolean;
}

@Injectable()
export class KeywordsMatchesService {
  constructor(
    @Inject('IKeywordsRepository')
    private readonly repository: IKeywordsRepository,
  ) {}

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
      const boundaryEnd = endsWithWordChar ? `(?!${WORD_CHARS_PATTERN})` : '';

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

    const keywords = await this.repository.findManyWithSelect({
      id: true,
      word: true,
      isPhrase: true,
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

    const totalComments = await this.repository.countComments();
    const totalPosts = await this.repository.countPosts();
    const batchSize = 1000;
    let processed = 0;
    let updated = 0;
    let created = 0;
    let deleted = 0;

    for (let offset = 0; offset < totalComments; offset += batchSize) {
      const comments = await this.repository.findCommentsBatch({
        skip: offset,
        take: batchSize,
      });

      for (const comment of comments) {
        const normalizedText = normalizeForKeywordMatch(comment.text);

        if (!normalizedText) {
          await this.repository.deleteCommentKeywordMatches({
            commentId: comment.id,
            source: MatchSource.COMMENT,
          });
          processed++;
          continue;
        }

        const matchedKeywordIds = new Set(
          keywordCandidates
            .filter((keyword) => matchesKeyword(normalizedText, keyword))
            .map((keyword) => keyword.id),
        );

        const existingMatches = await this.repository.findCommentKeywordMatches(
          {
            commentId: comment.id,
            source: MatchSource.COMMENT,
          },
        );

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
            await this.repository.deleteCommentKeywordMatches({
              commentId: comment.id,
              source: MatchSource.COMMENT,
              keywordIds: toDelete,
            });
            deleted += toDelete.length;
          }

          if (toCreate.length > 0) {
            await this.repository.createCommentKeywordMatches(
              toCreate.map((keywordId) => ({
                commentId: comment.id,
                keywordId,
                source: MatchSource.COMMENT,
              })),
            );
            created += toCreate.length;
          }

          updated++;
        }

        processed++;
      }
    }

    for (let offset = 0; offset < totalPosts; offset += batchSize) {
      const posts = await this.repository.findPostsBatch({
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

        const comments = await this.repository.findCommentsByPost({
          ownerId: post.ownerId,
          postId: post.vkPostId,
        });

        if (comments.length === 0) {
          continue;
        }

        const commentIds = comments.map((c) => c.id);

        const existingMatches = await this.repository.findPostKeywordMatches({
          commentIds,
          source: MatchSource.POST,
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
            toDelete.push({
              commentId: match.commentId,
              keywordId: match.keywordId,
            });
          }
        }

        if (toCreate.length > 0 || toDelete.length > 0) {
          if (toDelete.length > 0) {
            for (const { commentId, keywordId } of toDelete) {
              await this.repository.deletePostKeywordMatches({
                commentId,
                keywordId,
                source: MatchSource.POST,
              });
            }
            deleted += toDelete.length;
          }

          if (toCreate.length > 0) {
            await this.repository.createCommentKeywordMatches(
              toCreate.map(({ commentId, keywordId }) => ({
                commentId,
                keywordId,
                source: MatchSource.POST,
              })),
            );
            created += toCreate.length;
          }

          updated++;
        }
      }
    }

    return { processed, updated, created, deleted };
  }
}
