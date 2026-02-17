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
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const strings_util_1 = require("../../../common/utils/strings.util");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_service_1 = require("../../../db/drizzle/drizzle.service");
const schema_1 = require("../../../db/drizzle/schema");
let TokenService = class TokenService {
    constructor(configService, drizzleService) {
        this.configService = configService;
        this.drizzleService = drizzleService;
    }
    async hashToken(token) {
        const pepper = this.configService.get('TOKEN_PEPPER');
        return (0, strings_util_1.sha256)(pepper + token);
    }
    async findUserByToken(token) {
        const tokenHash = await this.hashToken(token);
        const result = await this.drizzleService.db
            .select({
            userId: schema_1.apiTokens.userId,
            tokenLabel: schema_1.apiTokens.label,
        })
            .from(schema_1.apiTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.apiTokens.tokenHash, tokenHash))
            .limit(1);
        if (result.length === 0) {
            return null;
        }
        const userResult = await this.drizzleService.db
            .select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            username: schema_1.users.username,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            role: schema_1.users.role,
            marketingOptIn: schema_1.users.marketingOptIn,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, result[0].userId))
            .limit(1);
        if (userResult.length === 0) {
            return null;
        }
        await this.drizzleService.db
            .update(schema_1.apiTokens)
            .set({ lastUsedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.apiTokens.tokenHash, tokenHash));
        return userResult[0];
    }
    async findNodeByAgentKey(agentName, agentKey) {
        const agentKeyHash = await this.hashToken(agentKey);
        const result = await this.drizzleService.db
            .select()
            .from(schema_1.nodes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.nodes.name, agentName), (0, drizzle_orm_1.eq)(schema_1.nodes.agentKeyHash, agentKeyHash)))
            .limit(1);
        return result.length > 0 ? result[0] : null;
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        drizzle_service_1.DrizzleService])
], TokenService);
//# sourceMappingURL=token.service.js.map