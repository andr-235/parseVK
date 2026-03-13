import { describe, expect, it } from 'vitest';
import {
  normalizePhoneNumber,
  normalizeTgmbaseQuery,
} from './normalize-tgmbase-query.util.js';

describe('normalizeTgmbaseQuery', () => {
  it('detects telegramId', () => {
    expect(normalizeTgmbaseQuery('123456789')).toMatchObject({
      queryType: 'telegramId',
      normalizedValue: '123456789',
    });
  });

  it('detects username and trims the leading @', () => {
    expect(normalizeTgmbaseQuery('@Sample_User')).toMatchObject({
      queryType: 'username',
      normalizedValue: 'sample_user',
    });
  });

  it('detects phoneNumber', () => {
    expect(normalizeTgmbaseQuery('+7 (999) 123-45-67')).toMatchObject({
      queryType: 'phoneNumber',
      normalizedValue: '+79991234567',
    });
  });

  it('marks empty input as invalid', () => {
    expect(normalizeTgmbaseQuery('   ')).toMatchObject({
      queryType: 'invalid',
    });
  });
});

describe('normalizePhoneNumber', () => {
  it('removes formatting characters', () => {
    expect(normalizePhoneNumber('+7 (999) 123-45-67')).toBe('+79991234567');
  });
});
