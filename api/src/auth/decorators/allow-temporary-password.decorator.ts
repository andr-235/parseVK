import { SetMetadata } from '@nestjs/common';
import { ALLOW_TEMP_PASSWORD_KEY } from '../auth.constants.js';

export const AllowTemporaryPassword = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(ALLOW_TEMP_PASSWORD_KEY, true);
