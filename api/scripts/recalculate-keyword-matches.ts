import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { MatchSource, PrismaClient } from '../src/generated/prisma/client';

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

interface KeywordMatchCandidate {
  id: number;
  normalizedWord: string;
  isPhrase: boolean;
}

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const matchesKeyword = (
  text: string,
  keyword: KeywordMatchCandidate,
): boolean => {
  if (keyword.isPhrase) {
    const escaped = escapeRegExp(keyword.normalizedWord);
    const pattern = `\\b${escaped}\\b`;
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  } else {
    const escaped = escapeRegExp(keyword.normalizedWord);
    const pattern = `\\b${escaped}`;
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  }
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    console.warn('Загрузка ключевых слов...');
    const keywords = await prisma.keyword.findMany({
      select: { id: true, word: true, isPhrase: true },
    });

    console.warn(`Найдено ${keywords.length} ключевых слов`);

    console.warn('Подготовка ключевых слов...');
    const keywordCandidates: KeywordMatchCandidate[] = keywords
      .map((keyword) => {
        const normalized = normalizeForKeywordMatch(keyword.word);
        return {
          id: keyword.id,
          normalizedWord: normalized,
          isPhrase: keyword.isPhrase,
        };
      })
      .filter((keyword) => keyword.normalizedWord.length > 0);

    console.warn(
      `Сгенерировано форм для ${keywordCandidates.length} ключевых слов`,
    );

    console.warn('Загрузка комментариев...');
    const totalComments = await prisma.comment.count();
    console.warn(`Всего комментариев: ${totalComments}`);

    const batchSize = 1000;
    let processed = 0;
    let updated = 0;
    let created = 0;
    let deleted = 0;

    for (let offset = 0; offset < totalComments; offset += batchSize) {
      const comments = await prisma.comment.findMany({
        select: { id: true, text: true },
        skip: offset,
        take: batchSize,
      });

      for (const comment of comments) {
        const normalizedText = normalizeForKeywordMatch(comment.text);

        if (!normalizedText) {
          await prisma.commentKeywordMatch.deleteMany({
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

        const existingMatches = await prisma.commentKeywordMatch.findMany({
          where: { commentId: comment.id, source: MatchSource.COMMENT },
          select: { keywordId: true },
        });

        const existingKeywordIds = new Set<number>(
          existingMatches.map((match) => match.keywordId),
        );

        const toCreate = Array.from(matchedKeywordIds).filter(
          (keywordId: number) => !existingKeywordIds.has(keywordId),
        );
        const toDelete = Array.from(existingKeywordIds).filter(
          (keywordId: number) => !matchedKeywordIds.has(keywordId),
        );

        if (toCreate.length > 0 || toDelete.length > 0) {
          if (toDelete.length > 0) {
            await prisma.commentKeywordMatch.deleteMany({
              where: {
                commentId: comment.id,
                source: MatchSource.COMMENT,
                keywordId: { in: toDelete },
              },
            });
            deleted += toDelete.length;
          }

          if (toCreate.length > 0) {
            await prisma.commentKeywordMatch.createMany({
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

        if (processed % 100 === 0) {
          console.warn(
            `Обработано комментариев: ${processed}/${totalComments}`,
          );
        }
      }
    }

    console.warn('\nЗагрузка постов...');
    const totalPosts = await prisma.post.count();
    console.warn(`Всего постов: ${totalPosts}`);

    let processedPosts = 0;

    for (let offset = 0; offset < totalPosts; offset += batchSize) {
      const posts = await prisma.post.findMany({
        select: { id: true, ownerId: true, vkPostId: true, text: true },
        skip: offset,
        take: batchSize,
      });

      for (const post of posts) {
        const normalizedText = normalizeForKeywordMatch(post.text);

        if (!normalizedText) {
          const comments = await prisma.comment.findMany({
            where: { ownerId: post.ownerId, postId: post.vkPostId },
            select: { id: true },
          });

          if (comments.length > 0) {
            await prisma.commentKeywordMatch.deleteMany({
              where: {
                commentId: { in: comments.map((c) => c.id) },
                source: MatchSource.POST,
              },
            });
          }
          processedPosts++;
          continue;
        }

        const matchedKeywordIds = new Set(
          keywordCandidates
            .filter((keyword) => matchesKeyword(normalizedText, keyword))
            .map((keyword) => keyword.id),
        );

        const comments = await prisma.comment.findMany({
          where: { ownerId: post.ownerId, postId: post.vkPostId },
          select: { id: true },
        });

        if (comments.length === 0) {
          processedPosts++;
          continue;
        }

        const commentIds = comments.map((c) => c.id);

        const existingMatches = await prisma.commentKeywordMatch.findMany({
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
            toDelete.push({
              commentId: match.commentId,
              keywordId: match.keywordId,
            });
          }
        }

        if (toCreate.length > 0 || toDelete.length > 0) {
          if (toDelete.length > 0) {
            for (const { commentId, keywordId } of toDelete) {
              await prisma.commentKeywordMatch.deleteMany({
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
            await prisma.commentKeywordMatch.createMany({
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

        processedPosts++;

        if (processedPosts % 100 === 0) {
          console.warn(`Обработано постов: ${processedPosts}/${totalPosts}`);
        }
      }
    }

    console.warn('\n=== Результаты ===');
    console.warn(`Обработано комментариев: ${processed}`);
    console.warn(`Обработано постов: ${processedPosts}`);
    console.warn(`Обновлено записей: ${updated}`);
    console.warn(`Создано совпадений: ${created}`);
    console.warn(`Удалено совпадений: ${deleted}`);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
