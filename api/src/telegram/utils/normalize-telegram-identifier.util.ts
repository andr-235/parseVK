import type { NormalizedTelegramIdentifier } from '../interfaces/telegram-client.interface.js';

const TELEGRAM_LINK_PREFIX = /^(?:https?:\/\/)?t\.me\//i;

export function normalizeTelegramIdentifier(
  raw: string,
): NormalizedTelegramIdentifier {
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      raw,
      normalized: '',
      kind: 'invalid',
    };
  }

  if (/^-100\d+$/.test(trimmed)) {
    return {
      raw,
      normalized: trimmed,
      kind: 'channelNumericId',
      numericTelegramId: BigInt(trimmed.slice(4)),
    };
  }

  if (/^\d+$/.test(trimmed)) {
    return {
      raw,
      normalized: trimmed,
      kind: 'numericId',
      numericTelegramId: BigInt(trimmed),
    };
  }

  const withoutPrefix = trimmed.replace(TELEGRAM_LINK_PREFIX, '');
  const internalMessageMatch = withoutPrefix.match(/^c\/(\d+)\/(\d+)$/);
  if (internalMessageMatch) {
    const chatId = internalMessageMatch[1];
    return {
      raw,
      normalized: `-100${chatId}`,
      kind: 'channelNumericId',
      numericTelegramId: BigInt(chatId),
    };
  }

  const inviteMatch = withoutPrefix.match(
    /^(?:\+|joinchat\/)([A-Za-z0-9_-]+)$/,
  );
  if (inviteMatch) {
    return {
      raw,
      normalized: inviteMatch[1],
      kind: 'inviteLink',
      inviteHash: inviteMatch[1],
    };
  }

  const username = extractUsername(trimmed) ?? extractUsername(withoutPrefix);
  if (username) {
    return {
      raw,
      normalized: username,
      kind: TELEGRAM_LINK_PREFIX.test(trimmed) ? 'publicLink' : 'username',
      username,
    };
  }

  return {
    raw,
    normalized: trimmed,
    kind: 'invalid',
  };
}

function extractUsername(value: string): string | null {
  const normalized = value.startsWith('@') ? value.slice(1) : value;
  return /^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(normalized) ? normalized : null;
}
