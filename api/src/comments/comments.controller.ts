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
import { CommentsQueryValidator } from './validators/comments-query.validator';

const DEFAULT_LIMIT = 100;

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly queryValidator: CommentsQueryValidator,
  ) {}

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
    const normalizedOffset = this.queryValidator.normalizeOffset(offset);
    const normalizedLimit = this.queryValidator.normalizeLimit(limit);
    const keywords = this.queryValidator.parseKeywords(keywordsParam);
    const keywordSource =
      this.queryValidator.normalizeKeywordSource(keywordSourceParam);
    const readStatus = this.queryValidator.normalizeReadStatus(readStatusParam);
    const normalizedSearch = this.queryValidator.normalizeSearch(search);

    return this.commentsService.getComments({
      offset: normalizedOffset,
      limit: normalizedLimit,
      keywords,
      keywordSource,
      readStatus,
      search: normalizedSearch,
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
    @Query('keywords') keywordsParam?: string | string[],
    @Query('keywordSource') keywordSourceParam?: string,
    @Query('readStatus') readStatusParam?: string,
    @Query('search') search?: string,
  ): Promise<CommentsCursorListDto> {
    const normalizedLimit =
      this.queryValidator.normalizeLimitWithDefault(limit);
    const keywords = this.queryValidator.parseKeywords(keywordsParam);
    const keywordSource =
      this.queryValidator.normalizeKeywordSource(keywordSourceParam);
    const readStatus = this.queryValidator.normalizeReadStatus(readStatusParam);
    const normalizedSearch = this.queryValidator.normalizeSearch(search);

    return this.commentsService.getCommentsCursor({
      cursor,
      limit: normalizedLimit,
      keywords,
      keywordSource,
      readStatus,
      search: normalizedSearch,
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
