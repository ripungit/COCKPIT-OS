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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_service_1 = require("../../db/drizzle/drizzle.service");
const schema_1 = require("../../db/drizzle/schema");
const error_codes_1 = require("../../common/constants/error-codes");
let UsersService = class UsersService {
    constructor(drizzle) {
        this.drizzle = drizzle;
    }
    async getUserById(id) {
        const db = this.drizzle.db;
        const [user] = await db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .limit(1);
        return user || null;
    }
    async updateUser(userId, dto) {
        const db = this.drizzle.db;
        const updateData = {
            updatedAt: new Date(),
        };
        if (dto.firstName !== undefined) {
            updateData.firstName = dto.firstName;
        }
        if (dto.lastName !== undefined) {
            updateData.lastName = dto.lastName;
        }
        if (dto.marketingOptIn !== undefined) {
            updateData.marketingOptIn = dto.marketingOptIn;
        }
        if (dto.wallpaperId !== undefined) {
            updateData.wallpaperId = dto.wallpaperId;
        }
        const [updated] = await db
            .update(schema_1.users)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .returning();
        if (!updated) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        return updated;
    }
    async getAllUsers() {
        const db = this.drizzle.db;
        return db.select().from(schema_1.users);
    }
    async updateUserRole(userId, role) {
        const db = this.drizzle.db;
        const [updated] = await db
            .update(schema_1.users)
            .set({ role, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .returning();
        if (!updated) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        return updated;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])
], UsersService);
//# sourceMappingURL=users.service.js.map