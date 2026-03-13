import { describe, expect, it } from 'vitest';
import { normalizeTelegramIdentifier } from './normalize-telegram-identifier.util.js';

describe('normalizeTelegramIdentifier', () => {
  it('detects username with at-sign', () => {
    expect(normalizeTelegramIdentifier('@durov')).toMatchObject({
      kind: 'username',
      username: 'durov',
      normalized: 'durov',
    });
  });

  it('detects public t.me link', () => {
    expect(normalizeTelegramIdentifier('https://t.me/durov')).toMatchObject({
      kind: 'publicLink',
      username: 'durov',
      normalized: 'durov',
    });
  });

  it('detects invite link', () => {
    expect(normalizeTelegramIdentifier('https://t.me/+abc123')).toMatchObject({
      kind: 'inviteLink',
      inviteHash: 'abc123',
      normalized: 'abc123',
    });
  });

  it('detects -100 channel id', () => {
    expect(normalizeTelegramIdentifier('-1001157519810')).toMatchObject({
      kind: 'channelNumericId',
      numericTelegramId: BigInt('1157519810'),
      normalized: '-1001157519810',
    });
  });

  it('detects plain numeric id', () => {
    expect(normalizeTelegramIdentifier('123456789')).toMatchObject({
      kind: 'numericId',
      numericTelegramId: BigInt('123456789'),
      normalized: '123456789',
    });
  });

  it('marks unsupported value as invalid', () => {
    expect(normalizeTelegramIdentifier('@@@')).toMatchObject({
      kind: 'invalid',
      normalized: '@@@',
    });
  });
});
