import { Api } from 'telegram';
import { describe, expect, it } from 'vitest';
import { TelegramCommentAuthorCollectorService } from './telegram-comment-author-collector.service.js';
import {
  TelegramChatType,
  TelegramMemberStatus,
} from '../types/telegram.enums.js';
import type { ResolvedDiscussionTarget } from '../interfaces/telegram-client.interface.js';
import type { TelegramClient } from 'telegram';

describe('TelegramCommentAuthorCollectorService', () => {
  const createThreadTarget = (): ResolvedDiscussionTarget => ({
    identifier: {
      raw: 'https://t.me/c/1949542659/115914',
      normalized: '-1001949542659',
      kind: 'channelNumericId',
      numericTelegramId: BigInt(1949542659),
      messageId: 115914,
    },
    resolvedChat: {
      telegramId: BigInt(1949542659),
      type: TelegramChatType.SUPERGROUP,
      title: 'Discussion chat',
      username: null,
      description: null,
      accessHash: '123',
      entity: new Api.Channel({
        id: BigInt(1949542659),
        title: 'Discussion chat',
        accessHash: BigInt(123),
        megagroup: true,
      }),
      totalMembers: null,
    },
    mode: 'thread',
    messageId: 115914,
  });

  it('collects unique user authors from thread messages', async () => {
    const service = new TelegramCommentAuthorCollectorService();
    const invoke = (request: unknown) => {
      if (request instanceof Api.messages.GetDiscussionMessage) {
        return Promise.resolve({
          messages: [
            new Api.Message({
              id: 991,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              date: 1,
              message: 'root',
            }),
          ],
          chats: [
            new Api.Channel({
              id: BigInt(1949542659),
              title: 'Discussion chat',
              accessHash: BigInt(123),
              megagroup: true,
            }),
          ],
        });
      }

      if (request instanceof Api.messages.GetReplies) {
        return Promise.resolve({
          messages: [
            new Api.Message({
              id: 1,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              fromId: new Api.PeerUser({ userId: BigInt(777) }),
              date: 1,
              message: 'first comment',
            }),
            new Api.Message({
              id: 2,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              fromId: new Api.PeerUser({ userId: BigInt(777) }),
              date: 2,
              message: 'duplicate author',
            }),
          ],
          users: [
            new Api.User({
              id: BigInt(777),
              firstName: 'Ivan',
              username: 'ivan',
            }),
          ],
        });
      }

      return Promise.reject(
        new Error(`Unexpected request: ${String(request)}`),
      );
    };

    const result = await service.collectAuthors(
      { invoke } as unknown as TelegramClient,
      createThreadTarget(),
      {},
    );

    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toMatchObject({
      status: TelegramMemberStatus.MEMBER,
      isAdmin: false,
      isOwner: false,
    });
    expect(result.members[0].user.username).toBe('ivan');
    expect(result.fetchedMessages).toBe(2);
    expect(result.total).toBe(1);
    expect(result.source).toBe('discussion_comments');
  });

  it('ignores service messages and non-user senders', async () => {
    const service = new TelegramCommentAuthorCollectorService();
    const invoke = (request: unknown) => {
      if (request instanceof Api.messages.GetDiscussionMessage) {
        return Promise.resolve({
          messages: [
            new Api.Message({
              id: 991,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              date: 1,
              message: 'root',
            }),
          ],
          chats: [
            new Api.Channel({
              id: BigInt(1949542659),
              title: 'Discussion chat',
              accessHash: BigInt(123),
              megagroup: true,
            }),
          ],
        });
      }

      if (request instanceof Api.messages.GetReplies) {
        return Promise.resolve({
          messages: [
            new Api.MessageService({
              id: 3,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              date: 1,
              action: new Api.MessageActionChatJoinedByLink(),
            }),
            new Api.Message({
              id: 4,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              fromId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              date: 1,
              message: 'channel sender',
            }),
          ],
          users: [],
        });
      }

      return Promise.reject(
        new Error(`Unexpected request: ${String(request)}`),
      );
    };

    const result = await service.collectAuthors(
      { invoke } as unknown as TelegramClient,
      createThreadTarget(),
      {},
    );

    expect(result.members).toEqual([]);
    expect(result.fetchedMessages).toBe(2);
    expect(result.total).toBe(0);
  });

  it('collects authors from chat history range and respects authorLimit', async () => {
    const service = new TelegramCommentAuthorCollectorService();
    const target: ResolvedDiscussionTarget = {
      ...createThreadTarget(),
      mode: 'chatRange',
      messageId: undefined,
    };
    let callCount = 0;
    const invoke = (request: unknown) => {
      if (!(request instanceof Api.messages.GetHistory)) {
        return Promise.reject(
          new Error(`Unexpected request: ${String(request)}`),
        );
      }

      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({
          messages: [
            new Api.Message({
              id: 10,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              fromId: new Api.PeerUser({ userId: BigInt(1) }),
              date: 1700000000,
              message: 'recent',
            }),
            new Api.Message({
              id: 9,
              peerId: new Api.PeerChannel({ channelId: BigInt(1949542659) }),
              fromId: new Api.PeerUser({ userId: BigInt(2) }),
              date: 1699999990,
              message: 'second',
            }),
          ],
          users: [
            new Api.User({ id: BigInt(1), firstName: 'One' }),
            new Api.User({ id: BigInt(2), firstName: 'Two' }),
          ],
        });
      }

      return Promise.resolve({ messages: [], users: [] });
    };

    const result = await service.collectAuthors(
      { invoke } as unknown as TelegramClient,
      target,
      {
        authorLimit: 1,
        messageLimit: 50,
      },
    );

    expect(result.members).toHaveLength(1);
    expect(result.members[0].user.firstName).toBe('One');
    expect(result.total).toBe(1);
    expect(result.source).toBe('discussion_comments');
  });
});
