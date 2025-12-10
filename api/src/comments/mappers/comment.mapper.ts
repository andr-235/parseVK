import { Injectable } from '@nestjs/common';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';

@Injectable()
export class CommentMapper {
  map(comment: CommentWithRelations): CommentWithAuthorDto {
    const { author, watchlistAuthorId, commentKeywordMatches, post } = comment;

    const matchedKeywords = (
      commentKeywordMatches as Array<{
        keyword: {
          id: number;
          word: string;
          category: string | null;
          isPhrase: boolean;
        };
        source: string;
      }>
    ).map((match) => ({
      id: match.keyword.id,
      word: match.keyword.word,
      category: match.keyword.category,
      isPhrase: match.keyword.isPhrase,
      source: match.source,
    }));

    return {
      ...comment,
      postText: (post as { text: string | null } | undefined)?.text ?? null,
      postAttachments:
        (post as { attachments: unknown } | undefined)?.attachments ?? null,
      postGroup: (
        post as
          | {
              group: {
                id: number;
                vkId: number;
                name: string;
                screenName: string | null;
                photo200: string | null;
                photo100: string | null;
              } | null;
            }
          | undefined
      )?.group
        ? {
            id: (post as { group: { id: number } }).group.id,
            vkId: (post as { group: { vkId: number } }).group.vkId,
            name: (post as { group: { name: string } }).group.name,
            screenName: (post as { group: { screenName: string | null } }).group
              .screenName,
            photo:
              (
                post as {
                  group: { photo200: string | null; photo100: string | null };
                }
              ).group.photo200 ??
              (post as { group: { photo100: string | null } }).group.photo100 ??
              null,
          }
        : null,
      author: (author as {
        vkUserId: number;
        firstName: string;
        lastName: string;
        photo200Orig: string | null;
        photo100: string | null;
        photo50: string | null;
      } | null)
        ? {
            vkUserId: (author as { vkUserId: number }).vkUserId,
            firstName: (author as { firstName: string }).firstName,
            lastName: (author as { lastName: string }).lastName,
            logo:
              (author as { photo200Orig: string | null }).photo200Orig ??
              (author as { photo100: string | null }).photo100 ??
              (author as { photo50: string | null }).photo50 ??
              null,
          }
        : null,
      isWatchlisted: watchlistAuthorId != null,
      matchedKeywords,
    } as CommentWithAuthorDto;
  }

  mapMany(comments: CommentWithRelations[]): CommentWithAuthorDto[] {
    return comments.map((comment) => this.map(comment));
  }
}
