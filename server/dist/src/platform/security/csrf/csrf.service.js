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
exports.CsrfService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const cookie_service_1 = require("../cookies/cookie.service");
let CsrfService = class CsrfService {
    constructor(cookieService) {
        this.cookieService = cookieService;
    }
    generateToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    rotateCsrfToken(res) {
        const token = this.generateToken();
        this.cookieService.setCsrfCookie(res, token);
        return token;
    }
    validateToken(cookieToken, headerToken) {
        if (!cookieToken || !headerToken) {
            return false;
        }
        if (cookieToken.length !== headerToken.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < cookieToken.length; i++) {
            result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
        }
        return result === 0;
    }
};
exports.CsrfService = CsrfService;
exports.CsrfService = CsrfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cookie_service_1.CookieService])
], CsrfService);
//# sourceMappingURL=csrf.service.js.map