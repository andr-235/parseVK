import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import type { AuthorsListDto } from './dto/author-card.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

@Controller('authors')
export class AuthorsController {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  @Get()
  async listAuthors(
    @Query('search') search?: string,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset = 0,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit = DEFAULT_LIMIT,
  ): Promise<AuthorsListDto> {
    const normalizedOffset = Math.max(offset, 0);
    const normalizedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    return this.authorsService.getAuthors({
      search,
      offset: normalizedOffset,
      limit: normalizedLimit,
    });
  }

  @Post('refresh')
  async refreshAuthors(): Promise<{ updated: number }> {
    const updated = await this.authorActivityService.refreshAllAuthors();
    return { updated };
  }
}
