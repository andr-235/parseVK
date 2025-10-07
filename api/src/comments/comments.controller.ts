import { Controller, Get } from '@nestjs/common';
import { CommentsService } from './comments.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(): Promise<CommentWithAuthorDto[]> {
    return this.commentsService.getAllComments();
  }
}
