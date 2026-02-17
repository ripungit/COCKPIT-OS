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
exports.CsrfGuard = exports.CSRF_EXEMPT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const csrf_service_1 = require("./csrf.service");
const cookie_constants_1 = require("../cookies/cookie.constants");
const error_codes_1 = require("../../../common/constants/error-codes");
exports.CSRF_EXEMPT_KEY = 'csrf_exempt';
let CsrfGuard = class CsrfGuard {
    constructor(csrfService, reflector) {
        this.csrfService = csrfService;
        this.reflector = reflector;
        this.mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = request.method.toUpperCase();
        if (!this.mutatingMethods.includes(method)) {
            return true;
        }
        const isExempt = this.reflector.getAllAndOverride(exports.CSRF_EXEMPT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isExempt) {
            return true;
        }
        const cookieToken = request.cookies?.[cookie_constants_1.COOKIE_NAMES.CSRF];
        const headerToken = request.headers['x-csrf-token'];
        if (!this.csrfService.validateToken(cookieToken, headerToken)) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.CSRF_INVALID,
                message: 'Invalid CSRF token',
            });
        }
        return true;
    }
};
exports.CsrfGuard = CsrfGuard;
exports.CsrfGuard = CsrfGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [csrf_service_1.CsrfService,
        core_1.Reflector])
], CsrfGuard);
//# sourceMappingURL=csrf.guard.js.map