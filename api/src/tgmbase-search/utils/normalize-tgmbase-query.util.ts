export type TgmbaseQueryType =
  | 'telegramId'
  | 'username'
  | 'phoneNumber'
  | 'invalid';

export interface NormalizedTgmbaseQuery {
  rawValue: string;
  normalizedValue: string;
  queryType: TgmbaseQueryType;
}

const USERNAME_PATTERN = /^@?[a-zA-Z0-9_]{3,32}$/;

export const normalizePhoneNumber = (value: string): string =>
  value.replace(/[^\d+]/g, '');

export const normalizeTgmbaseQuery = (
  rawValue: string,
): NormalizedTgmbaseQuery => {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return {
      rawValue,
      normalizedValue: '',
      queryType: 'invalid',
    };
  }

  if (/^\d+$/.test(trimmed)) {
    return {
      rawValue,
      normalizedValue: trimmed,
      queryType: 'telegramId',
    };
  }

  const phoneCandidate = normalizePhoneNumber(trimmed);
  if (/^\+?\d{10,15}$/.test(phoneCandidate)) {
    return {
      rawValue,
      normalizedValue: phoneCandidate,
      queryType: 'phoneNumber',
    };
  }

  if (USERNAME_PATTERN.test(trimmed)) {
    return {
      rawValue,
      normalizedValue: trimmed.replace(/^@/, '').toLowerCase(),
      queryType: 'username',
    };
  }

  return {
    rawValue,
    normalizedValue: trimmed,
    queryType: 'invalid',
  };
};
