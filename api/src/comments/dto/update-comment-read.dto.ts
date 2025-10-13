import { IsBoolean } from 'class-validator';

export class UpdateCommentReadDto {
  @IsBoolean()
  isRead!: boolean;
}
