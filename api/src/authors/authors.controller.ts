import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto';
import { ListAuthorsQueryDto } from './dto/list-authors-query.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  async listAuthors(
    @Query() query: ListAuthorsQueryDto,
  ): Promise<AuthorListDto> {
    return this.authorsService.listAuthors({
      offset: query.offset,
      limit: query.limit,
      search: query.search,
      verified: query.verified,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get(':vkUserId')
  async getAuthorDetails(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<AuthorDetailsDto> {
    return this.authorsService.getAuthorDetails(vkUserId);
  }

  @Post('refresh')
  async refreshAuthors(): Promise<{ updated: number }> {
    const updated = await this.authorsService.refreshAuthors();
    return { updated };
  }

  @Delete(':vkUserId')
  async deleteAuthor(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<{ deleted: boolean }> {
    await this.authorsService.deleteAuthor(vkUserId);
    return { deleted: true };
  }

  @Patch(':vkUserId/verify')
  async verifyAuthor(
    @Param('vkUserId', ParseIntPipe) vkUserId: number,
  ): Promise<{ verifiedAt: string }> {
    return this.authorsService.markAuthorVerified(vkUserId);
  }
}
