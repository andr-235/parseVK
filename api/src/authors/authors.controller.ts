import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
}
