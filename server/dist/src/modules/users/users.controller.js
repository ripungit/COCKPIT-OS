"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const passkeys_service_1 = require("../auth/passkeys/passkeys.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const csrf_guard_1 = require("../../platform/security/csrf/csrf.guard");
const current_user_decorator_1 = require("../../platform/http/decorators/current-user.decorator");
const update_me_dto_1 = require("./dto/update-me.dto");
let UsersController = class UsersController {
    constructor(usersService, passkeysService) {
        this.usersService = usersService;
        this.passkeysService = passkeysService;
    }
    getMe(user) {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            marketingOptIn: user.marketingOptIn,
            wallpaperId: user.wallpaperId || 11,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async updateMe(userId, dto) {
        const updated = await this.usersService.updateUser(userId, dto);
        return {
            id: updated.id,
            email: updated.email,
            username: updated.username,
            firstName: updated.firstName,
            lastName: updated.lastName,
            role: updated.role,
            marketingOptIn: updated.marketingOptIn,
            wallpaperId: updated.wallpaperId,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
        };
    }
    async getPasskeys(userId) {
        const passkeys = await this.passkeysService.getUserPasskeys(userId);
        return passkeys.map((p) => ({
            id: p.id,
            deviceType: p.deviceType,
            backedUp: p.backedUp,
            createdAt: p.createdAt,
        }));
    }
    async startPasskeyRegistration(userId) {
        return this.passkeysService.startRegistration(userId);
    }
    async finishPasskeyRegistration(userId, body) {
        await this.passkeysService.finishRegistration(userId, body.data);
        return { ok: true };
    }
    async deletePasskey(userId, passkeyId) {
        await this.passkeysService.deletePasskey(userId, passkeyId);
        return { ok: true };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(csrf_guard_1.CsrfGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_me_dto_1.UpdateMeDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Get)('me/passkeys'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user passkeys' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of user passkeys' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPasskeys", null);
__decorate([
    (0, common_1.Post)('me/passkeys/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start registering a new passkey' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Registration options' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "startPasskeyRegistration", null);
__decorate([
    (0, common_1.Post)('me/passkeys/finish'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Finish registering a new passkey' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Passkey registered' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "finishPasskeyRegistration", null);
__decorate([
    (0, common_1.Delete)('me/passkeys/:id'),
    (0, common_1.UseGuards)(csrf_guard_1.CsrfGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a passkey' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Passkey deleted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deletePasskey", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        passkeys_service_1.PasskeysService])
], UsersController);
//# sourceMappingURL=users.controller.js.map