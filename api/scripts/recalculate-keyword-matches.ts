import { PrismaClient } from '@prisma/client';
import { generateAllWordForms } from '../src/common/utils/russian-nouns.util';

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
  normalizedForms: string[];
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Загрузка ключевых слов...');
    const keywords = await prisma.keyword.findMany({
      select: { id: true, word: true },
    });

    console.log(`Найдено ${keywords.length} ключевых слов`);

    console.log('Генерация форм склонений...');
    const keywordCandidates: KeywordMatchCandidate[] = keywords
      .map((keyword) => {
        const forms = generateAllWordForms(keyword.word);
        return {
          id: keyword.id,
          normalizedForms: forms,
        };
      })
      .filter((keyword) => keyword.normalizedForms.length > 0);

    console.log(`Сгенерировано форм для ${keywordCandidates.length} ключевых слов`);

    console.log('Загрузка комментариев...');
    const totalComments = await prisma.comment.count();
    console.log(`Всего комментариев: ${totalComments}`);

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
          await prisma.commentKeywordMatch.deleteMany({ where: { commentId: comment.id } });
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

        const existingMatches = await prisma.commentKeywordMatch.findMany({
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
            await prisma.commentKeywordMatch.deleteMany({
              where: {
                commentId: comment.id,
                keywordId: { in: toDelete },
              },
            });
            deleted += toDelete.length;
          }

          if (toCreate.length > 0) {
            await prisma.commentKeywordMatch.createMany({
              data: toCreate.map((keywordId) => ({ commentId: comment.id, keywordId })),
              skipDuplicates: true,
            });
            created += toCreate.length;
          }

          updated++;
        }

        processed++;

        if (processed % 100 === 0) {
          console.log(`Обработано: ${processed}/${totalComments}`);
        }
      }
    }

    console.log('\n=== Результаты ===');
    console.log(`Обработано комментариев: ${processed}`);
    console.log(`Обновлено комментариев: ${updated}`);
    console.log(`Создано совпадений: ${created}`);
    console.log(`Удалено совпадений: ${deleted}`);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

