import { Injectable } from '@nestjs/common';
import { TelegramClient, Api } from 'telegram';
import bigInt from 'big-integer';
import { TelegramChatType } from '@prisma/client';
import type {
  ResolvedChat,
  MemberRecord,
  ParticipantCollection,
} from '../interfaces/telegram-client.interface';
import { TelegramMemberMapper } from '../mappers/telegram-member.mapper';

@Injectable()
export class TelegramParticipantCollectorService {
  constructor(private readonly memberMapper: TelegramMemberMapper) {}

  async collectParticipants(
    client: TelegramClient,
    resolved: ResolvedChat,
    limit: number,
  ): Promise<ParticipantCollection> {
    if (
      resolved.type === TelegramChatType.CHANNEL ||
      resolved.type === TelegramChatType.SUPERGROUP
    ) {
      return this.collectChannelParticipants(
        client,
        resolved.entity as Api.Channel,
        limit,
      );
    }

    if (resolved.type === TelegramChatType.GROUP) {
      return this.collectChatParticipants(
        client,
        resolved.entity as Api.Chat,
        limit,
      );
    }

    return this.collectPrivateParticipant(resolved.entity as Api.User);
  }

  private async collectChannelParticipants(
    client: TelegramClient,
    channel: Api.Channel,
    limit: number,
  ): Promise<ParticipantCollection> {
    const members: MemberRecord[] = [];
    let offset = 0;
    const maxToFetch = Math.max(1, Math.min(limit, 10000));
    const totalMembers =
      typeof channel.participantsCount === 'number'
        ? channel.participantsCount
        : null;

    while (members.length < maxToFetch) {
      const batchLimit = Math.min(200, maxToFetch - members.length);
      const response = await client.invoke(
        new Api.channels.GetParticipants({
          channel: new Api.InputChannel({
            channelId: this.toTelegramLong(channel.id),
            accessHash: this.toTelegramLong(channel.accessHash ?? 0),
          }),
          filter: new Api.ChannelParticipantsRecent(),
          offset,
          limit: batchLimit,
          hash: bigInt.zero,
        }),
      );

      if (!('participants' in response)) {
        break;
      }

      const usersMap = this.buildUsersMap(response.users);

      for (const participant of response.participants) {
        const userKey = this.extractChannelParticipantUserKey(participant);
        if (!userKey) {
          continue;
        }
        const user = usersMap.get(userKey);
        if (!user) {
          continue;
        }
        members.push(
          this.memberMapper.buildMemberRecordFromChannel(user, participant),
        );
        if (members.length >= maxToFetch) {
          break;
        }
      }

      if (response.participants.length < batchLimit) {
        break;
      }

      offset += response.participants.length;
    }

    return { members, total: totalMembers };
  }

  private async collectChatParticipants(
    client: TelegramClient,
    chat: Api.Chat,
    limit: number,
  ): Promise<ParticipantCollection> {
    const response = await client.invoke(
      new Api.messages.GetFullChat({
        chatId: chat.id,
      }),
    );

    if (!(response.fullChat instanceof Api.ChatFull)) {
      return { members: [], total: null };
    }

    const participantsContainer = response.fullChat.participants;
    const usersMap = this.buildUsersMap(response.users);
    const members: MemberRecord[] = [];
    let total: number | null = null;

    if (participantsContainer instanceof Api.ChatParticipants) {
      const entries = participantsContainer.participants ?? [];
      total = participantsContainer.participants?.length ?? null;
      for (const participant of entries) {
        const userKey = this.extractChatParticipantUserKey(participant);
        if (!userKey) {
          continue;
        }
        const user = usersMap.get(userKey);
        if (!user) {
          continue;
        }
        members.push(
          this.memberMapper.buildMemberRecordFromChat(user, participant),
        );
        if (members.length >= limit) {
          break;
        }
      }
    } else if (
      participantsContainer instanceof Api.ChatParticipantsForbidden &&
      participantsContainer.selfParticipant
    ) {
      const userKey = this.extractChatParticipantUserKey(
        participantsContainer.selfParticipant,
      );
      const user = userKey ? usersMap.get(userKey) : null;
      if (user) {
        members.push(
          this.memberMapper.buildMemberRecordFromChat(
            user,
            participantsContainer.selfParticipant,
          ),
        );
      }
      total = null;
    }

    return { members, total };
  }

  private collectPrivateParticipant(
    user: Api.User,
  ): ParticipantCollection {
    const member: MemberRecord = {
      user,
      status: 'MEMBER',
      isAdmin: false,
      isOwner: false,
      joinedAt: null,
      leftAt: null,
    };
    return { members: [member], total: 1 };
  }

  private buildUsersMap(users: Api.TypeUser[]): Map<string, Api.User> {
    const map = new Map<string, Api.User>();
    for (const entry of users) {
      if (entry instanceof Api.User) {
        map.set(this.bigIntKey(entry.id), entry);
      }
    }
    return map;
  }

  private extractChannelParticipantUserKey(
    participant: Api.TypeChannelParticipant,
  ): string | null {
    if ('userId' in participant && participant.userId !== undefined) {
      return this.bigIntKey(participant.userId);
    }
    if (
      participant instanceof Api.ChannelParticipantBanned ||
      participant instanceof Api.ChannelParticipantLeft
    ) {
      return this.extractPeerUserKey(participant.peer);
    }
    return null;
  }

  private extractChatParticipantUserKey(
    participant: Api.TypeChatParticipant,
  ): string | null {
    if ('userId' in participant && participant.userId !== undefined) {
      return this.bigIntKey(participant.userId);
    }
    return null;
  }

  private extractPeerUserKey(peer: Api.TypePeer | undefined): string | null {
    if (!peer) {
      return null;
    }
    if (peer instanceof Api.PeerUser) {
      return this.bigIntKey(peer.userId);
    }
    return null;
  }

  private bigIntKey(value: unknown): string {
    return this.memberMapper.toBigInt(value).toString();
  }

  private toTelegramLong(value: unknown): bigInt.BigInteger {
    return this.memberMapper.toTelegramLong(value);
  }
}

