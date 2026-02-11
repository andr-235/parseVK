import type { Request } from 'express';
import { refreshTokenExtractor } from './refresh-token.extractor.js';

const makeReq = (
  overrides: Partial<{
    cookies: Record<string, string>;
    headers: Record<string, string | string[]>;
    body: unknown;
  }> = {},
): Request =>
  ({
    cookies: {},
    headers: {},
    body: {},
    ...overrides,
  }) as unknown as Request;

describe('refreshTokenExtractor', () => {
  const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig';

  it('извлекает токен из cookie', () => {
    const req = makeReq({ cookies: { refreshToken: TOKEN } });
    expect(refreshTokenExtractor(req)).toBe(TOKEN);
  });

  it('извлекает токен из заголовка x-refresh-token (строка)', () => {
    const req = makeReq({ headers: { 'x-refresh-token': TOKEN } });
    expect(refreshTokenExtractor(req)).toBe(TOKEN);
  });

  it('извлекает токен из заголовка x-refresh-token (массив)', () => {
    const req = makeReq({ headers: { 'x-refresh-token': [TOKEN, 'other'] } });
    expect(refreshTokenExtractor(req)).toBe(TOKEN);
  });

  it('извлекает токен из тела запроса', () => {
    const req = makeReq({ body: { refreshToken: TOKEN } });
    expect(refreshTokenExtractor(req)).toBe(TOKEN);
  });

  it('cookie имеет приоритет над заголовком', () => {
    const req = makeReq({
      cookies: { refreshToken: 'from-cookie' },
      headers: { 'x-refresh-token': 'from-header' },
    });
    expect(refreshTokenExtractor(req)).toBe('from-cookie');
  });

  it('заголовок имеет приоритет над телом', () => {
    const req = makeReq({
      headers: { 'x-refresh-token': 'from-header' },
      body: { refreshToken: 'from-body' },
    });
    expect(refreshTokenExtractor(req)).toBe('from-header');
  });

  it('возвращает null если токен отсутствует', () => {
    expect(refreshTokenExtractor(makeReq())).toBeNull();
  });

  it('возвращает null для пустой строки в cookie', () => {
    const req = makeReq({ cookies: { refreshToken: '' } });
    expect(refreshTokenExtractor(req)).toBeNull();
  });

  it('возвращает null для пустой строки в теле', () => {
    const req = makeReq({ body: { refreshToken: '' } });
    expect(refreshTokenExtractor(req)).toBeNull();
  });
});
