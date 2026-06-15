var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Req, } from '@nestjs/common';
import { UserRole } from './types/user-role.enum.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';
let AdminUsersController = class AdminUsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async createUser(dto) {
        return this.usersService.createUser(dto);
    }
    async listUsers() {
        return this.usersService.listUsers();
    }
    async deleteUser(userId) {
        await this.usersService.deleteUser(userId);
    }
    async setTemporaryPassword(userId, request) {
        const adminId = request.user?.id ?? 0;
        return this.usersService.createTemporaryPassword(userId, adminId);
    }
    async resetPassword(userId, request) {
        const adminId = request.user?.id ?? 0;
        return this.usersService.resetUserPassword(userId, adminId);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateUserDto]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "createUser", null);
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "listUsers", null);
__decorate([
    Delete(':userId'),
    HttpCode(204),
    __param(0, Param('userId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "deleteUser", null);
__decorate([
    Post(':userId/set-temporary-password'),
    __param(0, Param('userId', ParseIntPipe)),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "setTemporaryPassword", null);
__decorate([
    Post(':userId/reset-password'),
    __param(0, Param('userId', ParseIntPipe)),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "resetPassword", null);
AdminUsersController = __decorate([
    Controller('admin/users'),
    Roles(UserRole.admin),
    __metadata("design:paramtypes", [UsersService])
], AdminUsersController);
export { AdminUsersController };
//# sourceMappingURL=admin-users.controller.js.map