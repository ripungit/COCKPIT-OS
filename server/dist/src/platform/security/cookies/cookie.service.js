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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cookie_constants_1 = require("./cookie.constants");
let CookieService = class CookieService {
    constructor(configService) {
        this.configService = configService;
        this.secure = this.configService.get('COOKIE_SECURE') === 'true';
        this.sameSite = this.configService.get('COOKIE_SAMESITE', 'lax');
        this.sessionTtlSeconds = parseInt(this.configService.get('SESSION_TTL_SECONDS', '604800'), 10);
    }
    setSessionCookie(res, sessionId) {
        res.cookie(cookie_constants_1.COOKIE_NAMES.SESSION, sessionId, {
            httpOnly: true,
            secure: this.secure,
            sameSite: this.sameSite,
            path: '/',
            maxAge: this.sessionTtlSeconds * 1000,
        });
    }
    clearSessionCookie(res) {
        res.clearCookie(cookie_constants_1.COOKIE_NAMES.SESSION, {
            httpOnly: true,
            secure: this.secure,
            sameSite: this.sameSite,
            path: '/',
        });
    }
    setCsrfCookie(res, token) {
        res.cookie(cookie_constants_1.COOKIE_NAMES.CSRF, token, {
            httpOnly: false,
            secure: this.secure,
            sameSite: this.sameSite,
            path: '/',
            maxAge: this.sessionTtlSeconds * 1000,
        });
    }
    clearCsrfCookie(res) {
        res.clearCookie(cookie_constants_1.COOKIE_NAMES.CSRF, {
            httpOnly: false,
            secure: this.secure,
            sameSite: this.sameSite,
            path: '/',
        });
    }
};
exports.CookieService = CookieService;
exports.CookieService = CookieService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CookieService);
//# sourceMappingURL=cookie.service.js.map