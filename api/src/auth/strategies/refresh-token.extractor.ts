import type { Request } from 'express';

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export const refreshTokenExtractor = (req: Request): string | null => {
  // 1) cookie (основной вариант с cookie-parser)
  const cookieToken = asNonEmptyString(req.cookies?.refreshToken);
  if (cookieToken) return cookieToken;

  // 2) custom header
  const header = req.headers['x-refresh-token'];
  if (Array.isArray(header)) {
    const headerToken = asNonEmptyString(header[0]);
    if (headerToken) return headerToken;
  } else {
    const headerToken = asNonEmptyString(header);
    if (headerToken) return headerToken;
  }

  // 3) body (fallback)
  const body = req.body as unknown;
  if (body && typeof body === 'object') {
    const token = asNonEmptyString(
      (body as Record<string, unknown>).refreshToken,
    );
    if (token) return token;
  }

  return null;
};
