import { Inject, Injectable } from '@nestjs/common';
import { MatchSource } from '../../common/types/match-source.enum.js';
import {
  buildKeywordMatchCandidates,
  matchesKeyword,
  normalizeForKeywordMatch,
} from '../../common/utils/keyword-normalization.utils.js';
import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface.js';

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
    const keywords = await this.repository.findManyForMatching();
    const keywordCandidates = buildKeywordMatchCandidates(keywords);

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
