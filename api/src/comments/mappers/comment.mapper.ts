import { Injectable } from '@nestjs/common';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto.js';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface.js';
import type {
  CommentAuthor,
  CommentKeywordMatches,
  PostWithGroup,
} from '../types/comment-structures.type.js';

@Injectable()
export class CommentMapper {
  /**
   * Маппит комментарий в DTO с автором и дополнительными полями
   */
  map(comment: CommentWithRelations): CommentWithAuthorDto {
    const { author, watchlistAuthorId, commentKeywordMatches, post } = comment;

    return {
      ...comment,
      postText: this.extractPostText(post),
      postAttachments: this.extractPostAttachments(post),
      postGroup: this.mapPostGroup(post),
      author: this.mapAuthor(author),
      isWatchlisted: watchlistAuthorId != null,
      matchedKeywords: this.mapMatchedKeywords(commentKeywordMatches),
    };
  }

  /**
   * Маппит массив комментариев
   */
  mapMany(comments: CommentWithRelations[]): CommentWithAuthorDto[] {
    return comments.map((comment) => this.map(comment));
  }

  /**
   * Маппит автора комментария
   */
  private mapAuthor(
    author: CommentAuthor | null,
  ): CommentWithAuthorDto['author'] {
    if (!author) {
      return null;
    }

    return {
      vkUserId: author.vkUserId,
      firstName: author.firstName,
      lastName: author.lastName,
      logo: this.selectAuthorPhoto(author),
    };
  }

  /**
   * Выбирает лучшее доступное фото автора
   */
  private selectAuthorPhoto(author: CommentAuthor): string | null {
    return author.photo200Orig ?? author.photo100 ?? author.photo50 ?? null;
  }

  /**
   * Маппит группу поста
   */
  private mapPostGroup(
    post: PostWithGroup | undefined,
  ): CommentWithAuthorDto['postGroup'] {
    const group = post?.group;
    if (!group) {
      return null;
    }

    return {
      id: group.id,
      vkId: group.vkId,
      name: group.name,
      screenName: group.screenName,
      photo: group.photo200 ?? group.photo100 ?? null,
    };
  }

  /**
   * Извлекает текст поста
   */
  private extractPostText(post: PostWithGroup | undefined): string | null {
    return post?.text ?? null;
  }

  /**
   * Извлекает вложения поста
   */
  private extractPostAttachments(post: PostWithGroup | undefined): unknown {
    return post?.attachments ?? null;
  }

  /**
   * Маппит совпадения ключевых слов
   */
  private mapMatchedKeywords(
    matches: CommentKeywordMatches,
  ): CommentWithAuthorDto['matchedKeywords'] {
    return matches.map((match) => ({
      id: match.keyword.id,
      word: match.keyword.word,
      category: match.keyword.category,
      isPhrase: match.keyword.isPhrase,
      source: match.source as 'COMMENT' | 'POST' | undefined,
    }));
  }
}
