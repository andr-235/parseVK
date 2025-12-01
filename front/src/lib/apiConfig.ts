const rawBaseUrl = (import.meta.env.VITE_API_URL ?? '').trim();

const fallbackBase = '/api';

const normalize = (value: string): string => {
  if (!value) {
    return fallbackBase;
  }

  const withoutTrailingSlash = value.replace(/\/+$/, '');

  if (
    withoutTrailingSlash === '/api' ||
    withoutTrailingSlash.endsWith('/api') ||
    withoutTrailingSlash.includes('/api/')
  ) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};

export const API_URL = normalize(rawBaseUrl);

