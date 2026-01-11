import { Injectable, Logger } from '@nestjs/common';
import { TelegramClient, Api } from 'telegram';
import type {
  ResolvedChat,
  MemberRecord,
} from '../interfaces/telegram-client.interface';
import type { TelegramMemberDto } from '../dto/telegram-member.dto';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository';
import { TelegramMemberRepository } from '../repositories/telegram-member.repository';
import {
  TelegramMemberMapper,
  type TelegramChatMemberRecord,
  type TelegramUserRecord,
} from '../mappers/telegram-member.mapper';
import { PrismaService } from '../../prisma.service';
import {
  TelegramMemberStatus,
  type TelegramChatTypeValue,
  type TelegramMemberStatusValue,
} from '../types/telegram.enums';

interface TelegramUserPersonal {
  flags?: number;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  birthday?: Api.Birthday;
  country?: string;
  countryCode?: string;
  about?: string;
}

@Injectable()
export class TelegramChatSyncService {
  private readonly logger = new Logger(TelegramChatSyncService.name);

  constructor(
    private readonly chatRepository: TelegramChatRepository,
    private readonly memberRepository: TelegramMemberRepository,
    private readonly memberMapper: TelegramMemberMapper,
    private readonly prisma: PrismaService,
  ) {}

  persistChat(
    resolved: ResolvedChat,
    members: MemberRecord[],
    client: TelegramClient,
    enrichWithFullData = false,
  ): Promise<{
    chatId: number;
    telegramId: bigint;
    members: TelegramMemberDto[];
  }> {
    return this.prisma.$transaction(async (tx) => {
      const chat = (await tx.telegramChat.upsert({
        where: { telegramId: resolved.telegramId },
        select: { id: true, telegramId: true },
        create: {
          telegramId: resolved.telegramId,
          type: resolved.type as unknown as TelegramChatTypeValue,
          title: resolved.title,
          username: resolved.username,
          description: resolved.description,
        },
        update: {
          type: resolved.type as unknown as TelegramChatTypeValue,
          title: resolved.title,
          username: resolved.username,
          description: resolved.description,
        },
      })) as { id: number; telegramId: bigint };

      const membersPayload: TelegramMemberDto[] = [];

      for (const member of members) {
        let userData = this.memberMapper.buildTelegramUserData(member.user);

        if (enrichWithFullData) {
          const fullData = await this.enrichUserWithFullData(
            client,
            member.user,
          );
          userData = {
            ...userData,
            ...fullData,
            personal:
              fullData.personal !== undefined
                ? fullData.personal
                : userData.personal,
            botInfo:
              fullData.botInfo !== undefined
                ? fullData.botInfo
                : userData.botInfo,
          } as typeof userData;
        }

        const userRecord = (await tx.telegramUser.upsert({
          where: { telegramId: this.memberMapper.toBigInt(member.user.id) },
          create: userData,
          update: userData,
        })) as {
          id: number;
          telegramId: bigint;
          firstName: string | null;
          lastName: string | null;
          username: string | null;
          phoneNumber: string | null;
          bio: string | null;
          languageCode: string | null;
          isBot: boolean;
          isPremium: boolean;
          deleted: boolean;
          restricted: boolean;
          verified: boolean;
          scam: boolean;
          fake: boolean;
          min: boolean;
          self: boolean;
          contact: boolean;
          mutualContact: boolean;
          accessHash: string | null;
          photoId: bigint | null;
          photoDcId: number | null;
          photoHasVideo: boolean;
          commonChatsCount: number | null;
          usernames: unknown;
          personal: unknown;
          botInfo: unknown;
          blocked: boolean;
          contactRequirePremium: boolean;
          spam: boolean;
          closeFriend: boolean;
          createdAt: Date;
          updatedAt: Date;
        };

        const joinedAt = member.joinedAt ?? null;
        const leftAt = member.leftAt ?? null;

        const memberRecordResult = await tx.telegramChatMember.upsert({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId: (userRecord as { id: number }).id,
            },
          },
          create: {
            chatId: chat.id,
            userId: (userRecord as { id: number }).id,
            status: member.status as unknown as TelegramMemberStatusValue,
            isAdmin: member.isAdmin,
            isOwner: member.isOwner,
            joinedAt,
            leftAt,
          },
          update: {
            status: member.status as unknown as TelegramMemberStatusValue,
            isAdmin: member.isAdmin,
            isOwner: member.isOwner,
            joinedAt,
            leftAt,
          },
        });

        const typedUserRecord = userRecord as TelegramUserRecord;
        const typedMemberRecord = {
          status: (memberRecordResult as { status: unknown })
            .status as TelegramMemberStatus,
          isAdmin: (memberRecordResult as { isAdmin: unknown })
            .isAdmin as boolean,
          isOwner: (memberRecordResult as { isOwner: unknown })
            .isOwner as boolean,
          joinedAt: (memberRecordResult as { joinedAt: unknown })
            .joinedAt as Date | null,
          leftAt: (memberRecordResult as { leftAt: unknown })
            .leftAt as Date | null,
        } satisfies TelegramChatMemberRecord;
        membersPayload.push(
          this.memberMapper.mapToMemberDto(typedUserRecord, typedMemberRecord),
        );
      }

      return {
        chatId: chat.id,
        telegramId: chat.telegramId,
        members: membersPayload,
      };
    });
  }

  private async enrichUserWithFullData(
    client: TelegramClient,
    user: Api.User,
  ): Promise<
    Partial<
      ReturnType<typeof TelegramMemberMapper.prototype.buildTelegramUserData>
    >
  > {
    try {
      const fullUser = await client.invoke(
        new Api.users.GetFullUser({ id: user.id }),
      );

      if (!(fullUser.fullUser instanceof Api.UserFull)) {
        return {};
      }

      const full = fullUser.fullUser;
      const personal =
        'personal' in full &&
        full.personal &&
        typeof full.personal === 'object' &&
        full.personal !== null
          ? {
              flags:
                'flags' in full.personal
                  ? (full.personal as TelegramUserPersonal).flags
                  : undefined,
              phoneNumber:
                'phoneNumber' in full.personal
                  ? (full.personal as TelegramUserPersonal).phoneNumber
                  : undefined,
              email:
                'email' in full.personal
                  ? (full.personal as TelegramUserPersonal).email
                  : undefined,
              firstName:
                'firstName' in full.personal
                  ? (full.personal as TelegramUserPersonal).firstName
                  : undefined,
              lastName:
                'lastName' in full.personal
                  ? (full.personal as TelegramUserPersonal).lastName
                  : undefined,
              birthday:
                'birthday' in full.personal
                  ? (full.personal as TelegramUserPersonal).birthday
                  : undefined,
              country:
                'country' in full.personal
                  ? (full.personal as TelegramUserPersonal).country
                  : undefined,
              countryCode:
                'countryCode' in full.personal
                  ? (full.personal as TelegramUserPersonal).countryCode
                  : undefined,
              about:
                'about' in full.personal
                  ? (full.personal as TelegramUserPersonal).about
                  : undefined,
            }
          : null;

      const botInfo = full.botInfo
        ? {
            userId: full.botInfo.userId?.toString(),
            description: full.botInfo.description,
            descriptionPhoto:
              full.botInfo.descriptionPhoto &&
              !(full.botInfo.descriptionPhoto instanceof Api.PhotoEmpty)
                ? {
                    photoId:
                      'photoId' in full.botInfo.descriptionPhoto
                        ? full.botInfo.descriptionPhoto.photoId?.toString()
                        : undefined,
                    dcId:
                      'dcId' in full.botInfo.descriptionPhoto
                        ? full.botInfo.descriptionPhoto.dcId
                        : undefined,
                  }
                : null,
            descriptionDocument:
              full.botInfo.descriptionDocument &&
              !(full.botInfo.descriptionDocument instanceof Api.DocumentEmpty)
                ? {
                    id:
                      'id' in full.botInfo.descriptionDocument
                        ? full.botInfo.descriptionDocument.id?.toString()
                        : undefined,
                    accessHash:
                      'accessHash' in full.botInfo.descriptionDocument
                        ? full.botInfo.descriptionDocument.accessHash?.toString()
                        : undefined,
                  }
                : null,
            commands:
              full.botInfo.commands?.map((cmd) => ({
                command: cmd.command,
                description: cmd.description,
              })) || null,
            menuButton: full.botInfo.menuButton
              ? {
                  type: full.botInfo.menuButton.className,
                }
              : null,
          }
        : null;

      const result: Partial<
        ReturnType<typeof TelegramMemberMapper.prototype.buildTelegramUserData>
      > = {
        bio: full.about ?? null,
        blocked: Boolean('blocked' in full && full.blocked),
        contactRequirePremium: Boolean(
          'contactRequirePremium' in full && full.contactRequirePremium,
        ),
        spam: Boolean('spam' in full && full.spam),
        closeFriend: Boolean('closeFriend' in full && full.closeFriend),
      };

      if (personal) {
        result.personal = JSON.parse(
          JSON.stringify(personal),
        ) as unknown as typeof result.personal;
      }
      if (botInfo) {
        result.botInfo = JSON.parse(
          JSON.stringify(botInfo),
        ) as unknown as typeof result.botInfo;
      }

      return result;
    } catch (err: unknown) {
      const userid = user.id as unknown as bigint | number;
      const userId =
        typeof userid === 'bigint' ? userid.toString() : String(userid);
      const errorMessage =
        err instanceof Error
          ? `${err.name}: ${err.message}`
          : typeof err === 'string'
            ? err
            : String(err);
      this.logger.warn(
        `Failed to get full user data for ${userId}: ${errorMessage}`,
      );
      return {};
    }
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
