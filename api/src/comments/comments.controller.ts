import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { CommentsService } from './comments.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import { UpdateCommentReadDto } from './dto/update-comment-read.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(): Promise<CommentWithAuthorDto[]> {
    return this.commentsService.getAllComments();
  }

  @Patch(':id/read')
  async updateReadStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() { isRead }: UpdateCommentReadDto,
  ): Promise<CommentWithAuthorDto> {
    return this.commentsService.setReadStatus(id, isRead);
  }
}
