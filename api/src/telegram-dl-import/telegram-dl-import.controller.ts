import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { TelegramDlImportService } from './telegram-dl-import.service.js';
import { TelegramDlImportFilesQueryDto } from './dto/telegram-dl-import-files-query.dto.js';
import { TelegramDlImportContactsQueryDto } from './dto/telegram-dl-import-contacts-query.dto.js';

@Controller('telegram/dl-import')
export class TelegramDlImportController {
  constructor(private readonly service: TelegramDlImportService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return this.service.uploadFiles(files);
  }

  @Get('files')
  getFiles(@Query() query: TelegramDlImportFilesQueryDto) {
    return this.service.getFiles(query);
  }

  @Get('contacts')
  getContacts(@Query() query: TelegramDlImportContactsQueryDto) {
    return this.service.getContacts(query);
  }
}
