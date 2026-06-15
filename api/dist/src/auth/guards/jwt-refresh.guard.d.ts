declare const JwtRefreshGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtRefreshGuard extends JwtRefreshGuard_base {
    handleRequest<TUser = any>(err: unknown, user: unknown): TUser;
}
export {};
