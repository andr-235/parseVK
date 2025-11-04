import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { validateSync, type ValidationError } from 'class-validator';
import { DataImportService } from './data-import.service';
import { ListingImportDto } from './dto/listing-import.dto';
import { ListingImportRequestDto } from './dto/listing-import-request.dto';
import type { ListingImportReportDto } from './dto/listing-import-report.dto';

@Controller('data')
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('import')
  async importData(
    @Body() body: ListingImportRequestDto,
  ): Promise<ListingImportReportDto> {
    const requestDto = this.validateBody(body);
    return this.dataImportService.importListings(requestDto);
  }

  private validateBody(
    body: ListingImportRequestDto,
  ): ListingImportRequestDto {
    const requestDto = Object.assign(new ListingImportRequestDto(), body);
    const requestErrors = validateSync(requestDto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (requestErrors.length > 0) {
      throw new BadRequestException({
        message: 'Неверный формат запроса импорта',
        errors: this.flattenErrors(requestErrors),
      });
    }

    const itemErrors: string[] = [];
    const validatedListings = requestDto.listings.map((item, index) => {
      const listingDto = Object.assign(new ListingImportDto(), item);
      const validationErrors = validateSync(listingDto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (validationErrors.length > 0) {
        const messages = this.flattenErrors(validationErrors);
        itemErrors.push(`Элемент ${index}: ${messages.join('; ')}`);
      }

      return listingDto;
    });

    if (itemErrors.length > 0) {
      throw new BadRequestException({
        message: 'Данные объявлений содержат ошибки',
        errors: itemErrors,
      });
    }

    requestDto.listings = validatedListings;
    return requestDto;
  }

  private flattenErrors(errors: ValidationError[]): string[] {
    const result: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        result.push(...Object.values(error.constraints));
      }

      if (error.children?.length) {
        result.push(...this.flattenErrors(error.children));
      }
    }

    return result;
  }
}
