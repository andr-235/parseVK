import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { IsStringOrNumber } from './validators/is-string-or-number.decorator';

export class ListingImportDto {
  @IsUrl({}, { message: 'url должен быть валидным URL' })
  @IsNotEmpty({ message: 'url обязателен' })
  url!: string;

  @IsOptional()
  @IsString({ message: 'source должен быть строкой' })
  source?: string;

  @IsOptional()
  @IsString({ message: 'externalId должен быть строкой' })
  externalId?: string;

  @IsOptional()
  @IsString({ message: 'title должен быть строкой' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'description должен быть строкой' })
  description?: string;

  @IsOptional()
  @IsStringOrNumber({ message: 'price должен быть строкой или числом' })
  price?: string | number | null;

  @IsOptional()
  @IsString({ message: 'currency должен быть строкой' })
  currency?: string;

  @IsOptional()
  @IsString({ message: 'address должен быть строкой' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'city должен быть строкой' })
  city?: string;

  @IsOptional()
  @IsStringOrNumber({ message: 'latitude должен быть строкой или числом' })
  latitude?: string | number | null;

  @IsOptional()
  @IsStringOrNumber({ message: 'longitude должен быть строкой или числом' })
  longitude?: string | number | null;

  @IsOptional()
  @IsStringOrNumber({ message: 'rooms должен быть строкой или числом' })
  rooms?: string | number | null;

  @IsOptional()
  @IsStringOrNumber({ message: 'areaTotal должен быть строкой или числом' })
  areaTotal?: string | number | null;

  @IsOptional()
  @IsStringOrNumber({ message: 'areaLiving должен быть строкой или числом' })
  areaLiving?: string | number | null;

  @IsOptional()
  @IsStringOrNumber({ message: 'areaKitchen должен быть строкой или числом' })
  areaKitchen?: string | number | null;

  @IsOptional()
  @IsStringOrNumber({ message: 'floor должен быть строкой или числом' })
  floor?: string | number | null;

  @IsOptional()
  @IsStringOrNumber({ message: 'floorsTotal должен быть строкой или числом' })
  floorsTotal?: string | number | null;

  @IsOptional()
  @IsDateString({}, { message: 'publishedAt должен быть датой в формате ISO' })
  publishedAt?: string;

  @IsOptional()
  @IsString({ message: 'contactName должен быть строкой' })
  contactName?: string;

  @IsOptional()
  @IsString({ message: 'contactPhone должен быть строкой' })
  contactPhone?: string;

  @IsOptional()
  @IsArray({ message: 'images должен быть массивом строк' })
  @IsString({
    each: true,
    message: 'каждый элемент images должен быть строкой',
  })
  images?: string[];

  @IsOptional()
  @IsString({ message: 'sourceAuthorName должен быть строкой' })
  sourceAuthorName?: string;

  @IsOptional()
  @IsString({ message: 'sourceAuthorPhone должен быть строкой' })
  sourceAuthorPhone?: string;

  @IsOptional()
  @IsString({ message: 'sourceAuthorUrl должен быть строкой' })
  sourceAuthorUrl?: string;

  @IsOptional()
  @IsString({ message: 'sourcePostedAt должен быть строкой' })
  sourcePostedAt?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'sourceParsedAt должен быть датой в формате ISO' },
  )
  sourceParsedAt?: string;

  @IsOptional()
  @IsObject({ message: 'metadata должен быть объектом' })
  metadata?: Record<string, unknown> | null;
}
