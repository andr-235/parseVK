import { IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class BulkAddKeywordsDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  words: string[];
}
