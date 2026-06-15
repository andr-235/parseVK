import { UserRole } from '../types/user-role.enum.js';
export declare class CreateUserDto {
    username: string;
    password: string;
    role?: UserRole;
}
