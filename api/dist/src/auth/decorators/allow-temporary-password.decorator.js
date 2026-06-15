import { SetMetadata } from '@nestjs/common';
import { ALLOW_TEMP_PASSWORD_KEY } from '../auth.constants.js';
export const AllowTemporaryPassword = () => SetMetadata(ALLOW_TEMP_PASSWORD_KEY, true);
//# sourceMappingURL=allow-temporary-password.decorator.js.map