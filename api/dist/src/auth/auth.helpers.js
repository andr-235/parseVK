import { UnauthorizedException } from '@nestjs/common';
export async function getUserOrThrow(usersService, userId) {
    const user = await usersService.findById(Number(userId));
    if (!user)
        throw new UnauthorizedException();
    return user;
}
//# sourceMappingURL=auth.helpers.js.map