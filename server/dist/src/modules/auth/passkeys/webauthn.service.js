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
exports.WebauthnService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const server_1 = require("@simplewebauthn/server");
let WebauthnService = class WebauthnService {
    constructor(configService) {
        this.configService = configService;
        this.rpName = this.configService.get('RP_NAME', 'Sandbox');
        this.rpId = this.configService.get('RP_ID', 'localhost');
        this.rpOrigin = this.configService.get('RP_ORIGIN', 'http://localhost:3000');
    }
    async generateRegistrationOptions(userId, userName, userDisplayName, existingPasskeys) {
        const excludeCredentials = existingPasskeys.map((passkey) => ({
            id: passkey.credentialId,
            type: 'public-key',
            transports: passkey.transports || undefined,
        }));
        const options = await (0, server_1.generateRegistrationOptions)({
            rpName: this.rpName,
            rpID: this.rpId,
            userID: new TextEncoder().encode(userId),
            userName,
            userDisplayName,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
            excludeCredentials,
        });
        return options;
    }
    async verifyRegistration(response, expectedChallenge) {
        const verification = await (0, server_1.verifyRegistrationResponse)({
            response,
            expectedChallenge,
            expectedOrigin: this.rpOrigin,
            expectedRPID: this.rpId,
        });
        return verification;
    }
    async generateAuthenticationOptions(passkeys) {
        const allowCredentials = passkeys.map((passkey) => ({
            id: passkey.credentialId,
            type: 'public-key',
            transports: passkey.transports || undefined,
        }));
        const options = await (0, server_1.generateAuthenticationOptions)({
            rpID: this.rpId,
            allowCredentials,
            userVerification: 'preferred',
        });
        return options;
    }
    async verifyAuthentication(response, expectedChallenge, authenticator) {
        const verification = await (0, server_1.verifyAuthenticationResponse)({
            response,
            expectedChallenge,
            expectedOrigin: this.rpOrigin,
            expectedRPID: this.rpId,
            authenticator,
        });
        return verification;
    }
    base64urlToUint8Array(base64url) {
        const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
        const binary = Buffer.from(base64, 'base64');
        return new Uint8Array(binary);
    }
    uint8ArrayToBase64url(buffer) {
        return Buffer.from(buffer)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
};
exports.WebauthnService = WebauthnService;
exports.WebauthnService = WebauthnService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WebauthnService);
//# sourceMappingURL=webauthn.service.js.map