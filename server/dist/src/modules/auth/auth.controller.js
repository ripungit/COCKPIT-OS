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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const passkeys_service_1 = require("./passkeys/passkeys.service");
const csrf_service_1 = require("../../platform/security/csrf/csrf.service");
const cookie_service_1 = require("../../platform/security/cookies/cookie.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const csrf_guard_1 = require("../../platform/security/csrf/csrf.guard");
const current_user_decorator_1 = require("../../platform/http/decorators/current-user.decorator");
const signup_start_dto_1 = require("./dto/signup-start.dto");
const signup_verify_dto_1 = require("./dto/signup-verify.dto");
const signup_password_dto_1 = require("./dto/signup-password.dto");
const login_password_dto_1 = require("./dto/login-password.dto");
const passkey_start_dto_1 = require("./dto/passkey-start.dto");
const passkey_finish_dto_1 = require("./dto/passkey-finish.dto");
let AuthController = class AuthController {
    constructor(authService, passkeysService, csrfService, cookieService) {
        this.authService = authService;
        this.passkeysService = passkeysService;
        this.csrfService = csrfService;
        this.cookieService = cookieService;
    }
    getCsrf(res) {
        this.csrfService.rotateCsrfToken(res);
        return { ok: true };
    }
    async signupStart(dto) {
        return this.authService.signupStart(dto);
    }
    async signupVerify(dto) {
        await this.authService.signupVerify(dto.userId, dto.otp);
        return { ok: true };
    }
    async signupPassword(dto, req, res) {
        await this.authService.signupPassword(dto.userId, dto.password);
        const sessionId = await this.authService.createSession(dto.userId, req.ip, req.headers['user-agent']);
        this.cookieService.setSessionCookie(res, sessionId);
        this.csrfService.rotateCsrfToken(res);
        return { ok: true };
    }
    async loginPassword(dto, req, res) {
        const user = await this.authService.loginPassword(dto.username, dto.password);
        const sessionId = await this.authService.createSession(user.id, req.ip, req.headers['user-agent']);
        this.cookieService.setSessionCookie(res, sessionId);
        this.csrfService.rotateCsrfToken(res);
        return { ok: true };
    }
    async logout(req, res) {
        if (req.sessionId) {
            await this.authService.revokeSession(req.sessionId);
        }
        this.cookieService.clearSessionCookie(res);
        this.csrfService.rotateCsrfToken(res);
        return { ok: true };
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async signupPasskeyStart(dto) {
        return this.passkeysService.startRegistration(dto.userId);
    }
    async signupPasskeyFinish(dto, req, res) {
        await this.passkeysService.finishRegistration(dto.userId, dto.data);
        const sessionId = await this.authService.createSession(dto.userId, req.ip, req.headers['user-agent']);
        this.cookieService.setSessionCookie(res, sessionId);
        this.csrfService.rotateCsrfToken(res);
        return { ok: true };
    }
    async loginPasskeyStart(dto) {
        return this.passkeysService.startAuthentication(dto.userId);
    }
    async loginPasskeyFinish(dto, req, res) {
        const userId = await this.passkeysService.finishAuthentication(dto.userId, dto.data);
        const sessionId = await this.authService.createSession(userId, req.ip, req.headers['user-agent']);
        this.cookieService.setSessionCookie(res, sessionId);
        this.csrfService.rotateCsrfToken(res);
        return { ok: true };
    }
    async devLogin(userId, req, res) {
        const targetUserId = userId || '97cdf7ec-490d-4da9-b4d5-2bfbd88f22e0';
        const sessionId = await this.authService.createSession(targetUserId, req.ip, req.headers['user-agent']);
        this.cookieService.setSessionCookie(res, sessionId);
        this.csrfService.rotateCsrfToken(res);
        return { ok: true, sessionId };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('csrf'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CSRF token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CSRF token set in cookie' }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCsrf", null);
__decorate([
    (0, common_1.Post)('signup/start'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, swagger_1.ApiOperation)({ summary: 'Start signup process' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created, returns userId' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_start_dto_1.SignupStartDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupStart", null);
__decorate([
    (0, common_1.Post)('signup/verify'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email with OTP' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email verified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_verify_dto_1.SignupVerifyDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupVerify", null);
__decorate([
    (0, common_1.Post)('signup/password'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Complete signup with password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password set, session created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_password_dto_1.SignupPasswordDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupPassword", null);
__decorate([
    (0, common_1.Post)('login/password'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_password_dto_1.LoginPasswordDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginPassword", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, csrf_guard_1.CsrfGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiCookieAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session revoked' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiCookieAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('signup/passkey/start'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, swagger_1.ApiOperation)({ summary: 'Start passkey registration during signup' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [passkey_start_dto_1.PasskeyStartDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupPasskeyStart", null);
__decorate([
    (0, common_1.Post)('signup/passkey/finish'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Finish passkey registration during signup' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [passkey_finish_dto_1.PasskeyFinishDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupPasskeyFinish", null);
__decorate([
    (0, common_1.Post)('login/passkey/start'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, swagger_1.ApiOperation)({ summary: 'Start passkey authentication' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [passkey_start_dto_1.PasskeyStartDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginPasskeyStart", null);
__decorate([
    (0, common_1.Post)('login/passkey/finish'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Finish passkey authentication' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [passkey_finish_dto_1.PasskeyFinishDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginPasskeyFinish", null);
__decorate([
    (0, common_1.Post)('dev/login'),
    (0, common_1.SetMetadata)(csrf_guard_1.CSRF_EXEMPT_KEY, true),
    (0, swagger_1.ApiOperation)({ summary: 'Dev Login (Backdoor)' }),
    __param(0, (0, common_1.Body)('userId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "devLogin", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        passkeys_service_1.PasskeysService,
        csrf_service_1.CsrfService,
        cookie_service_1.CookieService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map