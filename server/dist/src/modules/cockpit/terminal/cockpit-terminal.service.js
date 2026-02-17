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
var CockpitTerminalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CockpitTerminalService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_service_1 = require("../../../db/drizzle/drizzle.service");
const schema_1 = require("../../../db/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto = __importStar(require("crypto"));
let CockpitTerminalService = CockpitTerminalService_1 = class CockpitTerminalService {
    constructor(drizzle, configService) {
        this.drizzle = drizzle;
        this.configService = configService;
        this.logger = new common_1.Logger(CockpitTerminalService_1.name);
        this.algorithm = 'aes-256-gcm';
    }
    getEncryptionKey() {
        const key = this.configService.get('COCKPIT_SECRET_KEY');
        if (!key) {
            this.logger.error('COCKPIT_SECRET_KEY is not configured');
            throw new common_1.InternalServerErrorException('COCKPIT_SECRET_KEY is not configured');
        }
        return crypto.createHash('sha256').update(key).digest();
    }
    decryptSecret(encryptedPayload) {
        try {
            const { iv, content, tag } = JSON.parse(encryptedPayload);
            const key = this.getEncryptionKey();
            const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'base64'));
            decipher.setAuthTag(Buffer.from(tag, 'base64'));
            let decrypted = decipher.update(content, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error('Failed to decrypt secret', error);
            throw new common_1.InternalServerErrorException('Failed to decrypt secret');
        }
    }
    async createSession(userId, vpsId) {
        const [vps] = await this.drizzle.db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId), (0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId)));
        if (!vps) {
            throw new common_1.NotFoundException('VPS not found');
        }
        if (vps.status !== 'verified') {
            throw new common_1.BadRequestException({
                code: 'VPS_NOT_VERIFIED',
                message: 'VPS must be verified before opening a terminal session.',
            });
        }
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        let sessionId;
        try {
            const [session] = await this.drizzle.db
                .insert(schema_1.cockpitTerminalSessions)
                .values({
                userId,
                vpsId,
                status: 'created',
                expiresAt,
            })
                .returning();
            sessionId = session.id;
        }
        catch (error) {
            this.logger.warn('Failed to insert terminal session to DB, using fallback UUID', error);
            sessionId = crypto.randomUUID();
        }
        return {
            sessionId,
            wsUrl: `/cockpit/terminal/ws/${sessionId}`,
            vps,
        };
    }
    async getVpsCredentials(sessionId, userId) {
        let session;
        try {
            const result = await this.drizzle.db
                .select()
                .from(schema_1.cockpitTerminalSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitTerminalSessions.id, sessionId), (0, drizzle_orm_1.eq)(schema_1.cockpitTerminalSessions.userId, userId)));
            session = result[0];
        }
        catch (e) {
        }
        if (!session) {
            return null;
        }
        if (session.status === 'closed' || session.status === 'failed') {
            return null;
        }
        if (session.expiresAt && new Date() > session.expiresAt && session.status === 'created') {
            return null;
        }
        const [vps] = await this.drizzle.db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, session.vpsId));
        if (!vps)
            return null;
        return {
            ...vps,
            password: this.decryptSecret(vps.encryptedPassword),
        };
    }
    async markConnected(sessionId) {
        try {
            await this.drizzle.db
                .update(schema_1.cockpitTerminalSessions)
                .set({
                status: 'connected',
                connectedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.cockpitTerminalSessions.id, sessionId));
        }
        catch (e) {
        }
    }
    async markClosed(sessionId) {
        try {
            await this.drizzle.db
                .update(schema_1.cockpitTerminalSessions)
                .set({
                status: 'closed',
                closedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.cockpitTerminalSessions.id, sessionId));
        }
        catch (e) {
        }
    }
};
exports.CockpitTerminalService = CockpitTerminalService;
exports.CockpitTerminalService = CockpitTerminalService = CockpitTerminalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        config_1.ConfigService])
], CockpitTerminalService);
//# sourceMappingURL=cockpit-terminal.service.js.map