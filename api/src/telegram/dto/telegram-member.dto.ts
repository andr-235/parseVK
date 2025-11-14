import { TelegramMemberStatus } from '@prisma/client';

export class TelegramMemberDto {
  userId!: number;
  telegramId!: string;
  firstName!: string | null;
  lastName!: string | null;
  username!: string | null;
  phoneNumber!: string | null;
  status!: TelegramMemberStatus;
  isAdmin!: boolean;
  isOwner!: boolean;
  joinedAt!: string | null;
  leftAt!: string | null;
}

