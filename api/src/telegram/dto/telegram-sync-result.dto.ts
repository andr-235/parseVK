import { TelegramChatType } from '../types/telegram.enums.js';
import { TelegramMemberDto } from './telegram-member.dto.js';

export class TelegramSyncResultDto {
  chatId!: number;
  telegramId!: string;
  type!: TelegramChatType;
  title!: string | null;
  username!: string | null;
  syncedMembers!: number;
  totalMembers!: number | null;
  fetchedMembers!: number;
  members!: TelegramMemberDto[];
}
