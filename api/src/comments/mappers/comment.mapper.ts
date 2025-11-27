import { Injectable } from '@nestjs/common';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';

@Injectable()
export class CommentMapper {
  map(comment: CommentWithRelations): CommentWithAuthorDto {
    const { author, watchlistAuthorId, commentKeywordMatches, post } = comment;

    const matchedKeywords = commentKeywordMatches.map((match) => ({
      id: match.keyword.id,
      word: match.keyword.word,
      category: match.keyword.category,
    }));

    return {
      ...comment,
      postText: post?.text ?? null,
      author: author
        ? {
            vkUserId: author.vkUserId,
            firstName: author.firstName,
            lastName: author.lastName,
            logo:
              author.photo200Orig ?? author.photo100 ?? author.photo50 ?? null,
          }
        : null,
      isWatchlisted: watchlistAuthorId != null,
      matchedKeywords,
    };
  }

  mapMany(comments: CommentWithRelations[]): CommentWithAuthorDto[] {
    return comments.map((comment) => this.map(comment));
  }
}

