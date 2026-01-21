export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const ALLOW_TEMP_PASSWORD_KEY = 'allowTemporaryPassword';
// лучше вынести в auth.constants.ts, но можно оставить тут
export const PUBLIC_PATHS: readonly string[] = [
  '/health',
  '/metrics',
  '/api/health',
  '/api/metrics',
];
