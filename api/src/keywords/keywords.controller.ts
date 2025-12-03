import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KeywordsService } from './keywords.service';
import { AddKeywordDto } from './dto/add-keyword.dto';
import { BulkAddKeywordsDto } from './dto/bulk-add-keywords.dto';
import { KeywordIdParamDto } from './dto/keyword-id-param.dto';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
} from './interfaces/keyword.interface';

@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Post('add')
  async addKeyword(@Body() dto: AddKeywordDto): Promise<IKeywordResponse> {
    return this.keywordsService.addKeyword(
      dto.word,
      dto.category,
      dto.isPhrase,
    );
  }

  @Post('bulk-add')
  async bulkAddKeywords(
    @Body() dto: BulkAddKeywordsDto,
  ): Promise<IBulkAddResponse> {
    return this.keywordsService.bulkAddKeywords(dto.words);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadKeywords(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IBulkAddResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileContent = file.buffer.toString('utf-8');
    return this.keywordsService.addKeywordsFromFile(fileContent);
  }

  @Get()
  async getAllKeywords(): Promise<IKeywordResponse[]> {
    return this.keywordsService.getKeywords();
  }

  @Delete('all')
  async deleteAllKeywords(): Promise<IDeleteResponse> {
    return this.keywordsService.deleteAllKeywords();
  }

  @Delete(':id')
  async deleteKeyword(@Param() params: KeywordIdParamDto): Promise<IDeleteResponse> {
    return this.keywordsService.deleteKeyword(params.id);
  }

  @Post('recalculate-matches')
  async recalculateKeywordMatches(): Promise<{
    processed: number;
    updated: number;
    created: number;
    deleted: number;
  }> {
    return this.keywordsService.recalculateKeywordMatches();
  }
}
