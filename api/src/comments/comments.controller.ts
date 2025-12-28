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
import { DEFAULT_LIMIT } from './constants/comments.constants';
import { CommentsService } from './comments.service';
import { UpdateCommentReadDto } from './dto/update-comment-read.dto';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';
import type { CommentsListDto } from './dto/comments-list.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
    @Query('keywords') keywordsParam?: string | string[],
    @Query('keywordSource') keywordSourceParam?: string,
    @Query('readStatus') readStatusParam?: string,
    @Query('search') search?: string,
  ): Promise<CommentsListDto> {
    return this.commentsService.getCommentsFromRequest(
      offset,
      limit,
      keywordsParam,
      keywordSourceParam,
      readStatusParam,
      search,
    );
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
    @Query('keywords') keywordsParam?: string | string[],
    @Query('keywordSource') keywordSourceParam?: string,
    @Query('readStatus') readStatusParam?: string,
    @Query('search') search?: string,
  ): Promise<CommentsCursorListDto> {
    return this.commentsService.getCommentsCursorFromRequest(
      cursor,
      limit,
      keywordsParam,
      keywordSourceParam,
      readStatusParam,
      search,
    );
  }

  /**
   * Обновляет статус прочтения комментария
   *
   * @param id - ID комментария
   * @param isRead - Новый статус прочтения из тела запроса
   * @returns Обновленный комментарий с автором
   */
  @Patch(':id/read')
  async updateReadStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() { isRead }: UpdateCommentReadDto,
  ): Promise<CommentWithAuthorDto> {
    return this.commentsService.setReadStatus(id, isRead);
  }
}
