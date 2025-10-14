import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';
import { UpdateCommentReadDto } from './dto/update-comment-read.dto';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
  ): Promise<CommentsListDto> {
    const normalizedOffset = Math.max(offset, 0);
    const normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    return this.commentsService.getComments({
      offset: normalizedOffset,
      limit: normalizedLimit,
    });
  }

  /**
   * Cursor-based pagination (рекомендуется для новых реализаций)
   *
   * Преимущества:
   * - Быстрее на больших offset'ах (использует индекс)
   * - Нет проблемы "missing rows" при добавлении новых данных
   * - Работает с индексом [publishedAt DESC]
   */
  @Get('cursor')
  async getCommentsCursor(
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit?: number,
  ): Promise<CommentsCursorListDto> {
    const normalizedLimit = Math.min(
      Math.max(limit || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    return this.commentsService.getCommentsCursor({
      cursor,
      limit: normalizedLimit,
    });
  }

  @Patch(':id/read')
  async updateReadStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() { isRead }: UpdateCommentReadDto,
  ): Promise<CommentWithAuthorDto> {
    return this.commentsService.setReadStatus(id, isRead);
  }
}
