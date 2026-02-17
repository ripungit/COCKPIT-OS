"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_orm_1 = require("drizzle-orm");
const argon2 = __importStar(require("argon2"));
const uuid_1 = require("uuid");
const drizzle_service_1 = require("../../db/drizzle/drizzle.service");
const schema_1 = require("../../db/drizzle/schema");
const error_codes_1 = require("../../common/constants/error-codes");
const strings_util_1 = require("../../common/utils/strings.util");
const time_util_1 = require("../../common/utils/time.util");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    constructor(drizzle, configService, mailService) {
        this.drizzle = drizzle;
        this.configService = configService;
        this.mailService = mailService;
        this.sessionTtlSeconds = parseInt(this.configService.get('SESSION_TTL_SECONDS', '604800'), 10);
    }
    generateOtp() {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let otp = '';
        for (let i = 0; i < 4; i++) {
            otp += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return otp;
    }
    async signupStart(dto) {
        const db = this.drizzle.db;
        const email = (0, strings_util_1.normalizeEmail)(dto.email);
        const username = (0, strings_util_1.normalizeUsername)(dto.username);
        const existing = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.eq)(schema_1.users.username, username)))
            .limit(1);
        let userId;
        const otp = this.generateOtp();
        const otpExpiresAt = (0, time_util_1.addSeconds)(new Date(), 600);
        if (existing.length > 0) {
            const existingUser = existing[0];
            if (existingUser.passwordHash) {
                if (existingUser.email === email) {
                    throw new common_1.ConflictException({
                        code: error_codes_1.ErrorCodes.EMAIL_EXISTS,
                        message: 'Email already registered',
                    });
                }
                throw new common_1.ConflictException({
                    code: error_codes_1.ErrorCodes.USERNAME_EXISTS,
                    message: 'Username already taken',
                });
            }
            userId = existingUser.id;
            await db.update(schema_1.users)
                .set({ otp, otpExpiresAt, firstName: dto.firstName, lastName: dto.lastName })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }
        else {
            const [newUser] = await db
                .insert(schema_1.users)
                .values({
                email,
                username,
                firstName: dto.firstName,
                lastName: dto.lastName,
                marketingOptIn: dto.marketingOptIn ?? false,
                role: 'user',
                otp,
                otpExpiresAt,
                isEmailVerified: false,
            })
                .returning({ id: schema_1.users.id });
            userId = newUser.id;
        }
        try {
            await this.mailService.sendOtpEmail(email, otp);
        }
        catch (e) {
            console.error('Failed to send OTP email:', e);
        }
        return { userId };
    }
    async signupVerify(userId, otp) {
        const db = this.drizzle.db;
        const [user] = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException({ code: error_codes_1.ErrorCodes.USER_NOT_FOUND, message: 'User not found' });
        }
        if (user.isEmailVerified && user.passwordHash) {
            return;
        }
        if (!user.otp || !user.otpExpiresAt) {
            throw new common_1.UnauthorizedException({ message: 'No OTP request found' });
        }
        if (new Date() > user.otpExpiresAt) {
            throw new common_1.UnauthorizedException({ message: 'OTP expired' });
        }
        if (user.otp !== otp.toUpperCase()) {
            throw new common_1.UnauthorizedException({ message: 'Invalid OTP' });
        }
        await db.update(schema_1.users)
            .set({ isEmailVerified: true, otp: null, otpExpiresAt: null })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    }
    async signupPassword(userId, password) {
        const db = this.drizzle.db;
        const [user] = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException({ code: error_codes_1.ErrorCodes.USER_NOT_FOUND, message: 'User not found' });
        }
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException({ message: 'Email not verified' });
        }
        const passwordHash = await argon2.hash(password);
        await db
            .update(schema_1.users)
            .set({ passwordHash, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    }
    async loginPassword(usernameOrEmail, password) {
        const db = this.drizzle.db;
        const normalized = (0, strings_util_1.normalizeEmail)(usernameOrEmail);
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, normalized), (0, drizzle_orm_1.eq)(schema_1.users.username, normalized)))
            .limit(1);
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.INVALID_CREDENTIALS,
                message: 'Invalid credentials',
            });
        }
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.INVALID_CREDENTIALS,
                message: 'Invalid credentials',
            });
        }
        return user;
    }
    async createSession(userId, ip, userAgent) {
        const db = this.drizzle.db;
        const sessionId = (0, uuid_1.v4)();
        const now = new Date();
        const expiresAt = (0, time_util_1.addSeconds)(now, this.sessionTtlSeconds);
        await db.insert(schema_1.sessions).values({
            id: sessionId,
            userId,
            expiresAt,
            ip,
            userAgent,
        });
        return sessionId;
    }
    async revokeSession(sessionId) {
        const db = this.drizzle.db;
        await db
            .update(schema_1.sessions)
            .set({ revokedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
    }
    async getUserById(userId) {
        const db = this.drizzle.db;
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        return user || null;
    }
    async getUserByUsernameOrEmail(usernameOrEmail) {
        const db = this.drizzle.db;
        const normalized = (0, strings_util_1.normalizeEmail)(usernameOrEmail);
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, normalized), (0, drizzle_orm_1.eq)(schema_1.users.username, normalized)))
            .limit(1);
        return user || null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map