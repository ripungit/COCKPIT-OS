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
exports.SessionGuard = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_service_1 = require("../../../db/drizzle/drizzle.service");
const schema_1 = require("../../../db/drizzle/schema");
const cookie_constants_1 = require("../../security/cookies/cookie.constants");
const error_codes_1 = require("../../../common/constants/error-codes");
let SessionGuard = class SessionGuard {
    constructor(drizzle) {
        this.drizzle = drizzle;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const sessionId = request.cookies?.[cookie_constants_1.COOKIE_NAMES.SESSION];
        console.log('[SessionGuard] Cookies:', request.cookies);
        console.log('[SessionGuard] Session ID:', sessionId);
        if (!sessionId) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.SESSION_REQUIRED,
                message: 'Session required',
            });
        }
        const now = new Date();
        const db = this.drizzle.db;
        const [session] = await db
            .select()
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId), (0, drizzle_orm_1.isNull)(schema_1.sessions.revokedAt), (0, drizzle_orm_1.gt)(schema_1.sessions.expiresAt, now)))
            .limit(1);
        if (!session) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.SESSION_INVALID,
                message: 'Invalid or expired session',
            });
        }
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, session.userId))
            .limit(1);
        if (!user) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        request.user = {
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
        request.sessionId = session.id;
        return true;
    }
};
exports.SessionGuard = SessionGuard;
exports.SessionGuard = SessionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])
], SessionGuard);
//# sourceMappingURL=session.guard.js.map