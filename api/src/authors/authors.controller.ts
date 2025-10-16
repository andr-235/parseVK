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
  ): Promise<AuthorListDto> {
    return this.authorsService.listAuthors({ offset, limit, search });
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
