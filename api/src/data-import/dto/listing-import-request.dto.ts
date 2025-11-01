import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ListingImportDto } from './listing-import.dto';

export class ListingImportRequestDto {
  @IsArray({ message: 'listings должен быть массивом' })
  @ArrayNotEmpty({ message: 'listings не может быть пустым' })
  @ValidateNested({ each: true })
  listings!: ListingImportDto[];

  @IsOptional()
  @IsBoolean({ message: 'updateExisting должен быть логическим значением' })
  updateExisting?: boolean;
}
