import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KeywordsService } from './keywords.service.js';
import { AddKeywordDto } from './dto/add-keyword.dto.js';
import { BulkAddKeywordsDto } from './dto/bulk-add-keywords.dto.js';
import { UpdateKeywordCategoryDto } from './dto/update-keyword-category.dto.js';
import { KeywordFormDto } from './dto/keyword-form.dto.js';
import { KeywordIdParamDto } from './dto/keyword-id-param.dto.js';
import { GetKeywordsQueryDto } from './dto/get-keywords-query.dto.js';
import {
  IKeywordResponse,
  IDeleteResponse,
  IBulkAddResponse,
  IKeywordFormsResponse,
} from './interfaces/keyword.interface.js';

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

  @Patch(':id')
  async updateKeywordCategory(
    @Param() params: KeywordIdParamDto,
    @Body() dto: UpdateKeywordCategoryDto,
  ): Promise<IKeywordResponse> {
    return this.keywordsService.updateKeywordCategory(params.id, dto.category);
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
  async getAllKeywords(@Query() query: GetKeywordsQueryDto): Promise<{
    keywords: IKeywordResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.keywordsService.getKeywords({
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    });
  }

  @Delete('all')
  async deleteAllKeywords(): Promise<IDeleteResponse> {
    return this.keywordsService.deleteAllKeywords();
  }

  @Get(':id/forms')
  async getKeywordForms(
    @Param() params: KeywordIdParamDto,
  ): Promise<IKeywordFormsResponse> {
    return this.keywordsService.getKeywordForms(params.id);
  }

  @Post(':id/forms/manual')
  async addManualKeywordForm(
    @Param() params: KeywordIdParamDto,
    @Body() dto: KeywordFormDto,
  ): Promise<IKeywordFormsResponse> {
    return this.keywordsService.addManualKeywordForm(params.id, dto.form);
  }

  @Delete(':id/forms/manual')
  async removeManualKeywordForm(
    @Param() params: KeywordIdParamDto,
    @Body() dto: KeywordFormDto,
  ): Promise<IKeywordFormsResponse> {
    return this.keywordsService.removeManualKeywordForm(params.id, dto.form);
  }

  @Post(':id/forms/exclusions')
  async addKeywordFormExclusion(
    @Param() params: KeywordIdParamDto,
    @Body() dto: KeywordFormDto,
  ): Promise<IKeywordFormsResponse> {
    return this.keywordsService.addKeywordFormExclusion(params.id, dto.form);
  }

  @Delete(':id/forms/exclusions')
  async removeKeywordFormExclusion(
    @Param() params: KeywordIdParamDto,
    @Body() dto: KeywordFormDto,
  ): Promise<IKeywordFormsResponse> {
    return this.keywordsService.removeKeywordFormExclusion(params.id, dto.form);
  }

  @Delete(':id')
  async deleteKeyword(
    @Param() params: KeywordIdParamDto,
  ): Promise<IDeleteResponse> {
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

  @Post('rebuild-forms')
  async rebuildKeywordForms(): Promise<{
    keywordsRebuilt: number;
    processed: number;
    updated: number;
    created: number;
    deleted: number;
  }> {
    return this.keywordsService.rebuildKeywordForms();
  }
}
