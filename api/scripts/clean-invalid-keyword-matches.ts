import { MatchSource, PrismaClient } from '@prisma/client';

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

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Загрузка всех совпадений ключевых слов...');
    const allMatches = await prisma.commentKeywordMatch.findMany({
      include: {
        comment: {
          select: { text: true },
        },
        keyword: {
          select: { word: true },
        },
      },
    });

    console.log(`Найдено ${allMatches.length} совпадений`);

    console.log('Проверка совпадений...');
    let checked = 0;
    let deleted = 0;
    const toDelete: Array<{ commentId: number; keywordId: number; source: MatchSource }> = [];

    for (const match of allMatches) {
      checked++;
      const commentText = match.comment.text;
      const keywordWord = match.keyword.word;

      const normalizedText = normalizeForKeywordMatch(commentText);
      const normalizedKeyword = normalizeForKeywordMatch(keywordWord);

      if (!normalizedText.includes(normalizedKeyword)) {
        toDelete.push({
          commentId: match.commentId,
          keywordId: match.keywordId,
          source: match.source,
        });
      }

      if (checked % 1000 === 0) {
        console.log(`Проверено: ${checked}/${allMatches.length}`);
      }
    }

    console.log(`\nНайдено неправильных совпадений: ${toDelete.length}`);

    if (toDelete.length === 0) {
      console.log('Все совпадения корректны, удалять нечего.');
      return;
    }

    console.log('Удаление неправильных совпадений...');
    let deletedCount = 0;

    for (const match of toDelete) {
      await prisma.commentKeywordMatch.deleteMany({
        where: {
          commentId: match.commentId,
          keywordId: match.keywordId,
          source: match.source,
        },
      });
      deletedCount++;

      if (deletedCount % 100 === 0) {
        console.log(`Удалено: ${deletedCount}/${toDelete.length}`);
      }
    }

    console.log('\n=== Результаты ===');
    console.log(`Проверено совпадений: ${checked}`);
    console.log(`Удалено неправильных: ${deletedCount}`);
    console.log(`Осталось правильных: ${checked - deletedCount}`);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


