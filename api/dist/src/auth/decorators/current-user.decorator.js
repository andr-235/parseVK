import { createParamDecorator } from '@nestjs/common';
export const CurrentUser = createParamDecorator((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user ?? null;
});
//# sourceMappingURL=current-user.decorator.js.map