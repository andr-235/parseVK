import { TelegramChatMapper } from './telegram-chat.mapper';
import { Api } from 'telegram';
import { TelegramChatType } from '@prisma/client';

describe('TelegramChatMapper', () => {
  let mapper: TelegramChatMapper;

  beforeEach(() => {
    mapper = new TelegramChatMapper();
  });

  it('должен разрешать Channel в ResolvedChat', () => {
    const channel = new Api.Channel({
      id: BigInt(123),
      title: 'Test Channel',
      username: 'testchannel',
      megagroup: false,
      participantsCount: 1000,
    } as any);

    const result = mapper.resolveChat(channel);

    expect(result).toMatchObject({
      telegramId: BigInt(123),
      type: TelegramChatType.CHANNEL,
      title: 'Test Channel',
      username: 'testchannel',
      totalMembers: 1000,
    });
  });

  it('должен разрешать Supergroup в ResolvedChat', () => {
    const supergroup = new Api.Channel({
      id: BigInt(456),
      title: 'Test Supergroup',
      megagroup: true,
      participantsCount: 500,
    } as any);

    const result = mapper.resolveChat(supergroup);

    expect(result).toMatchObject({
      telegramId: BigInt(456),
      type: TelegramChatType.SUPERGROUP,
      title: 'Test Supergroup',
      totalMembers: 500,
    });
  });

  it('должен разрешать Chat в ResolvedChat', () => {
    const chat = new Api.Chat({
      id: BigInt(789),
      title: 'Test Chat',
      participantsCount: 50,
    } as any);

    const result = mapper.resolveChat(chat);

    expect(result).toMatchObject({
      telegramId: BigInt(789),
      type: TelegramChatType.GROUP,
      title: 'Test Chat',
      totalMembers: 50,
    });
  });

  it('должен разрешать User в ResolvedChat', () => {
    const user = new Api.User({
      id: BigInt(111),
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
    } as any);

    const result = mapper.resolveChat(user);

    expect(result).toMatchObject({
      telegramId: BigInt(111),
      type: TelegramChatType.PRIVATE,
      title: 'John Doe',
      username: 'johndoe',
      totalMembers: 1,
    });
  });

  it('должен возвращать null для неизвестного типа', () => {
    const result = mapper.resolveChat({});
    expect(result).toBeNull();
  });
});
