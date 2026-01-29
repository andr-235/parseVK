import { TelegramMemberMapper } from './telegram-member.mapper.js';
import { Api } from 'telegram';
import { TelegramMemberStatus } from '../types/telegram.enums.js';

describe('TelegramMemberMapper', () => {
  let mapper: TelegramMemberMapper;

  beforeEach(() => {
    mapper = new TelegramMemberMapper();
  });

  describe('mapChannelParticipantStatus', () => {
    it('должен маппить ChannelParticipantCreator', () => {
      const participant = new Api.ChannelParticipantCreator({
        userId: BigInt(123),
      } as unknown as ConstructorParameters<
        typeof Api.ChannelParticipantCreator
      >[0]);

      const result: {
        status: TelegramMemberStatus;
        isAdmin: boolean;
        isOwner: boolean;
        joinedAt: Date | null;
        leftAt: Date | null;
      } = mapper.mapChannelParticipantStatus(participant);

      expect(result).toEqual({
        status: TelegramMemberStatus.CREATOR,
        isAdmin: true,
        isOwner: true,
        joinedAt: null,
        leftAt: null,
      });
    });

    it('должен маппить ChannelParticipantAdmin', () => {
      const participant = new Api.ChannelParticipantAdmin({
        userId: BigInt(123),
        date: 1609459200,
      } as unknown as ConstructorParameters<
        typeof Api.ChannelParticipantAdmin
      >[0]);

      const result: {
        status: TelegramMemberStatus;
        isAdmin: boolean;
        isOwner: boolean;
        joinedAt: Date | null;
        leftAt: Date | null;
      } = mapper.mapChannelParticipantStatus(participant);

      expect(result).toEqual({
        status: TelegramMemberStatus.ADMINISTRATOR,
        isAdmin: true,
        isOwner: false,
        joinedAt: expect.any(Date),
        leftAt: null,
      });
    });

    it('должен маппить ChannelParticipantBanned', () => {
      const participant = new Api.ChannelParticipantBanned({
        peer: new Api.PeerUser({
          userId: BigInt(123),
        } as unknown as ConstructorParameters<typeof Api.PeerUser>[0]),
        left: false,
        date: 1609459200,
      } as unknown as ConstructorParameters<
        typeof Api.ChannelParticipantBanned
      >[0]);

      const result: {
        status: TelegramMemberStatus;
        isAdmin: boolean;
        isOwner: boolean;
        joinedAt: Date | null;
        leftAt: Date | null;
      } = mapper.mapChannelParticipantStatus(participant);

      expect(result.status).toBe(TelegramMemberStatus.RESTRICTED);
      expect(result.isAdmin).toBe(false);
      expect(result.isOwner).toBe(false);
    });
  });

  describe('formatMemberStatus', () => {
    it('должен форматировать статусы на русском', () => {
      expect(mapper.formatMemberStatus(TelegramMemberStatus.CREATOR)).toBe(
        'Создатель',
      );
      expect(
        mapper.formatMemberStatus(TelegramMemberStatus.ADMINISTRATOR),
      ).toBe('Администратор');
      expect(mapper.formatMemberStatus(TelegramMemberStatus.MEMBER)).toBe(
        'Участник',
      );
    });
  });

  describe('toBigInt', () => {
    it('должен конвертировать bigint', () => {
      expect(mapper.toBigInt(BigInt(123))).toBe(BigInt(123));
    });

    it('должен конвертировать number', () => {
      expect(mapper.toBigInt(123)).toBe(BigInt(123));
    });

    it('должен конвертировать string', () => {
      expect(mapper.toBigInt('123')).toBe(BigInt(123));
    });
  });
});
