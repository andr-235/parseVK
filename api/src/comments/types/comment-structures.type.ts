import type { Prisma } from '@prisma/client';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';

/**
 * Тип для автора комментария с выбранными полями
 */
export type CommentAuthor = NonNullable<CommentWithRelations['author']>;

/**
 * Тип для поста с группой (извлекается из CommentWithRelations)
 */
export type PostWithGroup = CommentWithRelations['post'];

/**
 * Тип для группы поста (извлекается из PostWithGroup)
 */
export type PostGroup = NonNullable<PostWithGroup['group']>;

/**
 * Тип для ключевого слова в совпадении
 */
export type KeywordInMatch = {
  id: number;
  word: string;
  category: string | null;
  isPhrase: boolean;
};

/**
 * Тип для совпадения ключевого слова в комментарии
 */
export type CommentKeywordMatch = {
  keyword: KeywordInMatch;
  source: string;
};

/**
 * Тип для массива совпадений ключевых слов
 */
export type CommentKeywordMatches = Array<CommentKeywordMatch>;

/**
 * Где-условие для поиска комментариев
 */
export type CommentWhereInput = Prisma.CommentWhereInput;

/**
 * Условие сортировки комментариев
 */
export type CommentOrderByInput = Prisma.CommentOrderByWithRelationInput;
