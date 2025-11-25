import { Injectable, Logger } from '@nestjs/common';
import { TelegramClient, Api } from 'telegram';
import type { ResolvedChat, MemberRecord } from '../interfaces/telegram-client.interface';
import type { TelegramMemberDto } from '../dto/telegram-member.dto';
import { TelegramChatRepository } from '../repositories/telegram-chat.repository';
import { TelegramMemberRepository } from '../repositories/telegram-member.repository';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper';
import { PrismaService } from '../../prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TelegramChatSyncService {
  private readonly logger = new Logger(TelegramChatSyncService.name);

  constructor(
    private readonly chatRepository: TelegramChatRepository,
    private readonly memberRepository: TelegramMemberRepository,
    private readonly memberMapper: TelegramMemberMapper,
    private readonly prisma: PrismaService,
  ) {}

  async persistChat(
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
      const chat = await tx.telegramChat.upsert({
        where: { telegramId: resolved.telegramId },
        create: {
          telegramId: resolved.telegramId,
          type: resolved.type,
          title: resolved.title,
          username: resolved.username,
          description: resolved.description,
        },
        update: {
          type: resolved.type,
          title: resolved.title,
          username: resolved.username,
          description: resolved.description,
        },
      });

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

        const userRecord = await tx.telegramUser.upsert({
          where: { telegramId: this.memberMapper.toBigInt(member.user.id) },
          create: userData,
          update: userData,
        });

        const joinedAt = member.joinedAt ?? null;
        const leftAt = member.leftAt ?? null;

        const memberRecord = await tx.telegramChatMember.upsert({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId: userRecord.id,
            },
          },
          create: {
            chatId: chat.id,
            userId: userRecord.id,
            status: member.status as any,
            isAdmin: member.isAdmin,
            isOwner: member.isOwner,
            joinedAt,
            leftAt,
          },
          update: {
            status: member.status as any,
            isAdmin: member.isAdmin,
            isOwner: member.isOwner,
            joinedAt,
            leftAt,
          },
        });

        membersPayload.push(
          this.memberMapper.mapToMemberDto(userRecord, memberRecord),
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
    Partial<ReturnType<typeof TelegramMemberMapper.prototype.buildTelegramUserData>>
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
              flags: (full.personal as any).flags,
              phoneNumber: (full.personal as any).phoneNumber,
              email: (full.personal as any).email,
              firstName: (full.personal as any).firstName,
              lastName: (full.personal as any).lastName,
              birthday: (full.personal as any).birthday,
              country: (full.personal as any).country,
              countryCode: (full.personal as any).countryCode,
              about: (full.personal as any).about,
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
    } catch (error) {
      this.logger.warn(
        `Failed to get full user data for ${user.id}: ${this.stringifyError(error)}`,
      );
      return {};
    }
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}

