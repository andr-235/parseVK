import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  async listAuthors(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('verified') verified?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<AuthorListDto> {
    return this.authorsService.listAuthors({
      offset,
      limit,
      search,
      verified: this.parseVerifiedQuery(verified),
      sortBy: sortBy ?? null,
      sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : null,
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

  private parseVerifiedQuery(value?: string): boolean | undefined {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return undefined;
  }
}
