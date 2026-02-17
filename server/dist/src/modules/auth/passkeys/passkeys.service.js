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
exports.PasskeysService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_service_1 = require("../../../db/drizzle/drizzle.service");
const schema_1 = require("../../../db/drizzle/schema");
const webauthn_service_1 = require("./webauthn.service");
const error_codes_1 = require("../../../common/constants/error-codes");
const time_util_1 = require("../../../common/utils/time.util");
const strings_util_1 = require("../../../common/utils/strings.util");
let PasskeysService = class PasskeysService {
    constructor(drizzle, webauthnService, configService) {
        this.drizzle = drizzle;
        this.webauthnService = webauthnService;
        this.configService = configService;
        this.challengeTtlSeconds = parseInt(this.configService.get('WEBAUTHN_CHALLENGE_TTL_SECONDS', '300'), 10);
    }
    async startRegistration(userId) {
        const db = this.drizzle.db;
        await this.cleanupExpiredChallenges();
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        const existingPasskeys = await db
            .select()
            .from(schema_1.passkeys)
            .where((0, drizzle_orm_1.eq)(schema_1.passkeys.userId, userId));
        const options = await this.webauthnService.generateRegistrationOptions(user.id, user.username, `${user.firstName} ${user.lastName}`, existingPasskeys);
        await db.insert(schema_1.webauthnChallenges).values({
            userId,
            challenge: options.challenge,
            type: 'registration',
            expiresAt: (0, time_util_1.addSeconds)(new Date(), this.challengeTtlSeconds),
        });
        return options;
    }
    async finishRegistration(userId, data) {
        const db = this.drizzle.db;
        const response = data;
        const now = new Date();
        const [challenge] = await db
            .select()
            .from(schema_1.webauthnChallenges)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.webauthnChallenges.userId, userId), (0, drizzle_orm_1.eq)(schema_1.webauthnChallenges.type, 'registration'), (0, drizzle_orm_1.gt)(schema_1.webauthnChallenges.expiresAt, now)))
            .orderBy(schema_1.webauthnChallenges.createdAt)
            .limit(1);
        if (!challenge) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.CHALLENGE_NOT_FOUND,
                message: 'No valid challenge found. Please start registration again.',
            });
        }
        const verification = await this.webauthnService.verifyRegistration(response, challenge.challenge);
        if (!verification.verified || !verification.registrationInfo) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.PASSKEY_REGISTRATION_FAILED,
                message: 'Passkey registration failed',
            });
        }
        const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
        await db.insert(schema_1.passkeys).values({
            userId,
            credentialId: credentialID,
            publicKey: this.webauthnService.uint8ArrayToBase64url(credentialPublicKey),
            counter,
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: response.response.transports || null,
        });
        await db
            .delete(schema_1.webauthnChallenges)
            .where((0, drizzle_orm_1.eq)(schema_1.webauthnChallenges.id, challenge.id));
    }
    async startAuthentication(usernameOrEmail) {
        const db = this.drizzle.db;
        await this.cleanupExpiredChallenges();
        const normalized = (0, strings_util_1.normalizeEmail)(usernameOrEmail);
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, normalized), (0, drizzle_orm_1.eq)(schema_1.users.username, normalized)))
            .limit(1);
        if (!user) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        const userPasskeys = await db
            .select()
            .from(schema_1.passkeys)
            .where((0, drizzle_orm_1.eq)(schema_1.passkeys.userId, user.id));
        if (userPasskeys.length === 0) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.PASSKEY_NOT_FOUND,
                message: 'No passkeys registered for this user',
            });
        }
        const options = await this.webauthnService.generateAuthenticationOptions(userPasskeys);
        await db.insert(schema_1.webauthnChallenges).values({
            userId: user.id,
            challenge: options.challenge,
            type: 'authentication',
            expiresAt: (0, time_util_1.addSeconds)(new Date(), this.challengeTtlSeconds),
        });
        return options;
    }
    async finishAuthentication(usernameOrEmail, data) {
        const db = this.drizzle.db;
        const response = data;
        const normalized = (0, strings_util_1.normalizeEmail)(usernameOrEmail);
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, normalized), (0, drizzle_orm_1.eq)(schema_1.users.username, normalized)))
            .limit(1);
        if (!user) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        const userPasskeys = await db
            .select()
            .from(schema_1.passkeys)
            .where((0, drizzle_orm_1.eq)(schema_1.passkeys.userId, user.id));
        const passkey = userPasskeys.find((p) => p.credentialId === response.id);
        if (!passkey) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.PASSKEY_NOT_FOUND,
                message: 'Passkey not found',
            });
        }
        const now = new Date();
        const [challenge] = await db
            .select()
            .from(schema_1.webauthnChallenges)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.webauthnChallenges.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.webauthnChallenges.type, 'authentication'), (0, drizzle_orm_1.gt)(schema_1.webauthnChallenges.expiresAt, now)))
            .orderBy(schema_1.webauthnChallenges.createdAt)
            .limit(1);
        if (!challenge) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.CHALLENGE_NOT_FOUND,
                message: 'No valid challenge found. Please start authentication again.',
            });
        }
        const verification = await this.webauthnService.verifyAuthentication(response, challenge.challenge, {
            credentialID: passkey.credentialId,
            credentialPublicKey: this.webauthnService.base64urlToUint8Array(passkey.publicKey),
            counter: passkey.counter,
            transports: passkey.transports || undefined,
        });
        if (!verification.verified) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.PASSKEY_AUTHENTICATION_FAILED,
                message: 'Passkey authentication failed',
            });
        }
        await db
            .update(schema_1.passkeys)
            .set({ counter: verification.authenticationInfo.newCounter })
            .where((0, drizzle_orm_1.eq)(schema_1.passkeys.id, passkey.id));
        await db
            .delete(schema_1.webauthnChallenges)
            .where((0, drizzle_orm_1.eq)(schema_1.webauthnChallenges.id, challenge.id));
        return user.id;
    }
    async getUserPasskeys(userId) {
        const db = this.drizzle.db;
        return db
            .select()
            .from(schema_1.passkeys)
            .where((0, drizzle_orm_1.eq)(schema_1.passkeys.userId, userId));
    }
    async deletePasskey(userId, passkeyId) {
        const db = this.drizzle.db;
        const result = await db
            .delete(schema_1.passkeys)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.passkeys.id, passkeyId), (0, drizzle_orm_1.eq)(schema_1.passkeys.userId, userId)))
            .returning({ id: schema_1.passkeys.id });
        if (result.length === 0) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.PASSKEY_NOT_FOUND,
                message: 'Passkey not found',
            });
        }
    }
    async cleanupExpiredChallenges() {
        const db = this.drizzle.db;
        const now = new Date();
        await db
            .delete(schema_1.webauthnChallenges)
            .where((0, drizzle_orm_1.lt)(schema_1.webauthnChallenges.expiresAt, now));
    }
};
exports.PasskeysService = PasskeysService;
exports.PasskeysService = PasskeysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        webauthn_service_1.WebauthnService,
        config_1.ConfigService])
], PasskeysService);
//# sourceMappingURL=passkeys.service.js.map