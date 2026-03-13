import { Injectable } from '@nestjs/common';
import { Api, utils, type TelegramClient } from 'telegram';
import bigInt from 'big-integer';
import type {
  DiscussionAuthorCollection,
  MemberRecord,
  ResolvedDiscussionTarget,
} from '../interfaces/telegram-client.interface.js';
import { TelegramMemberStatus } from '../types/telegram.enums.js';

export interface DiscussionAuthorCollectOptions {
  dateFrom?: string;
  dateTo?: string;
  messageLimit?: number;
  authorLimit?: number;
}

@Injectable()
export class TelegramCommentAuthorCollectorService {
  async collectAuthors(
    client: TelegramClient,
    target: ResolvedDiscussionTarget,
    options: DiscussionAuthorCollectOptions,
  ): Promise<DiscussionAuthorCollection> {
    if (target.mode === 'thread') {
      return this.collectThreadAuthors(client, target, options);
    }

    return this.collectHistoryAuthors(client, target, options);
  }

  private async collectThreadAuthors(
    client: TelegramClient,
    target: ResolvedDiscussionTarget,
    options: DiscussionAuthorCollectOptions,
  ): Promise<DiscussionAuthorCollection> {
    if (!target.messageId) {
      throw new Error('Для режима одного треда требуется messageId');
    }

    const discussion = await client.invoke(
      new Api.messages.GetDiscussionMessage({
        peer: target.resolvedChat.entity,
        msgId: target.messageId,
      }),
    );

    const relevantMessage = discussion.messages.reduce((prev, current) =>
      prev && prev.id < current.id ? prev : current,
    );

    const discussionChat = discussion.chats.find((chat) => {
      if (
        relevantMessage instanceof Api.Message &&
        relevantMessage.peerId instanceof Api.PeerChannel &&
        chat instanceof Api.Channel
      ) {
        return (
          chat.id.toString() === relevantMessage.peerId.channelId.toString()
        );
      }
      return false;
    });

    const replyPeer = discussionChat
      ? utils.getInputPeer(discussionChat)
      : target.resolvedChat.entity;

    const limit = Math.min(options.messageLimit ?? 100, 100);
    const response = await client.invoke(
      new Api.messages.GetReplies({
        peer: replyPeer,
        msgId: relevantMessage.id,
        offsetId: 0,
        offsetDate: 0,
        addOffset: 0,
        limit,
        maxId: 0,
        minId: 0,
        hash: bigInt.zero,
      }),
    );

    if (!('messages' in response) || !('users' in response)) {
      return {
        members: [],
        total: 0,
        fetchedMessages: 0,
        source: 'discussion_comments',
      };
    }

    const { members, fetchedMessages } = this.extractUniqueAuthors(
      response.messages,
      response.users,
      options.authorLimit,
    );

    return {
      members,
      total: members.length,
      fetchedMessages,
      source: 'discussion_comments',
    };
  }

  private async collectHistoryAuthors(
    client: TelegramClient,
    target: ResolvedDiscussionTarget,
    options: DiscussionAuthorCollectOptions,
  ): Promise<DiscussionAuthorCollection> {
    const members: MemberRecord[] = [];
    const seenUserIds = new Set<string>();
    const minTimestamp = options.dateFrom
      ? Math.floor(new Date(options.dateFrom).getTime() / 1000)
      : null;
    const maxTimestamp = options.dateTo
      ? Math.floor(new Date(options.dateTo).getTime() / 1000)
      : null;

    let fetchedMessages = 0;
    let offsetId = 0;
    const maxMessages = options.messageLimit ?? 200;

    while (fetchedMessages < maxMessages) {
      const batchSize = Math.min(100, maxMessages - fetchedMessages);
      const response = await client.invoke(
        new Api.messages.GetHistory({
          peer: target.resolvedChat.entity,
          offsetId,
          offsetDate: 0,
          addOffset: 0,
          limit: batchSize,
          maxId: 0,
          minId: 0,
          hash: bigInt.zero,
        }),
      );

      if (!('messages' in response) || response.messages.length === 0) {
        break;
      }

      fetchedMessages += response.messages.length;
      const usersMap = this.buildUsersMap(response.users);

      for (const message of response.messages) {
        if (!(message instanceof Api.Message)) {
          continue;
        }

        const timestamp = typeof message.date === 'number' ? message.date : 0;
        if (minTimestamp !== null && timestamp < minTimestamp) {
          continue;
        }
        if (maxTimestamp !== null && timestamp > maxTimestamp) {
          continue;
        }

        const userId = this.extractUserId(message.fromId);
        if (!userId || seenUserIds.has(userId)) {
          continue;
        }

        const user = usersMap.get(userId);
        if (!user) {
          continue;
        }

        seenUserIds.add(userId);
        members.push(this.buildMemberRecord(user));
        if (options.authorLimit && members.length >= options.authorLimit) {
          return {
            members,
            total: members.length,
            fetchedMessages,
            source: 'discussion_comments',
          };
        }
      }

      const lastMessage = response.messages[response.messages.length - 1];
      if (
        !(lastMessage instanceof Api.Message) ||
        response.messages.length < batchSize
      ) {
        break;
      }
      offsetId = lastMessage.id;
    }

    return {
      members,
      total: members.length,
      fetchedMessages,
      source: 'discussion_comments',
    };
  }

  private extractUniqueAuthors(
    messages: Api.TypeMessage[],
    users: Api.TypeUser[],
    authorLimit?: number,
  ): { members: MemberRecord[]; fetchedMessages: number } {
    const usersMap = this.buildUsersMap(users);
    const seenUserIds = new Set<string>();
    const members: MemberRecord[] = [];

    for (const message of messages) {
      const userId =
        message instanceof Api.Message
          ? this.extractUserId(message.fromId)
          : null;

      if (!userId || seenUserIds.has(userId)) {
        continue;
      }

      const user = usersMap.get(userId);
      if (!user) {
        continue;
      }

      seenUserIds.add(userId);
      members.push(this.buildMemberRecord(user));
      if (authorLimit && members.length >= authorLimit) {
        break;
      }
    }

    return {
      members,
      fetchedMessages: messages.length,
    };
  }

  private buildUsersMap(users: Api.TypeUser[]): Map<string, Api.User> {
    const map = new Map<string, Api.User>();
    for (const entry of users) {
      if (entry instanceof Api.User) {
        map.set(entry.id.toString(), entry);
      }
    }
    return map;
  }

  private extractUserId(fromId: Api.TypePeer | undefined): string | null {
    if (fromId instanceof Api.PeerUser) {
      return fromId.userId.toString();
    }

    return null;
  }

  private buildMemberRecord(user: Api.User): MemberRecord {
    return {
      user,
      status: TelegramMemberStatus.MEMBER,
      isAdmin: false,
      isOwner: false,
      joinedAt: null,
      leftAt: null,
    };
  }
}
