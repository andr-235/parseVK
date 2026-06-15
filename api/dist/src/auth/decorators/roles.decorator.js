import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../auth.constants.js';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
//# sourceMappingURL=roles.decorator.js.map