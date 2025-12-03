import { TelegramMemberStatus } from '@prisma/client';

export class TelegramMemberDto {
  userId!: number;
  telegramId!: string;
  firstName!: string | null;
  lastName!: string | null;
  username!: string | null;
  phoneNumber!: string | null;
  bio?: string | null;
  languageCode?: string | null;
  isBot?: boolean;
  isPremium?: boolean;
  deleted?: boolean;
  restricted?: boolean;
  verified?: boolean;
  scam?: boolean;
  fake?: boolean;
  min?: boolean;
  self?: boolean;
  contact?: boolean;
  mutualContact?: boolean;
  accessHash?: string | null;
  photoId?: string | null;
  photoDcId?: number | null;
  photoHasVideo?: boolean;
  commonChatsCount?: number | null;
  usernames?: Array<{
    username: string;
    active: boolean;
    editable: boolean;
  }> | null;
  personal?: {
    flags?: number;
    phoneNumber?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    birthday?: unknown;
    country?: string;
    countryCode?: string;
    about?: string;
  } | null;
  botInfo?: {
    userId?: string;
    description?: string;
    descriptionPhoto?: { photoId?: string; dcId?: number } | null;
    descriptionDocument?: { id?: string; accessHash?: string } | null;
    commands?: Array<{ command: string; description: string }> | null;
    menuButton?: { type: string } | null;
  } | null;
  blocked?: boolean;
  contactRequirePremium?: boolean;
  spam?: boolean;
  closeFriend?: boolean;
  status!: TelegramMemberStatus;
  isAdmin!: boolean;
  isOwner!: boolean;
  joinedAt!: string | null;
  leftAt!: string | null;
}
