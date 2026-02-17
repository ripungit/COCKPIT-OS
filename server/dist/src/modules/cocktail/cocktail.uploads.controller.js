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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocktailUploadsController = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const swagger_1 = require("@nestjs/swagger");
const cocktail_service_1 = require("./cocktail.service");
const storage_service_1 = require("./storage.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const current_user_decorator_1 = require("../../platform/http/decorators/current-user.decorator");
const schema_1 = require("../../db/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_service_1 = require("../../db/drizzle/drizzle.service");
let CocktailUploadsController = class CocktailUploadsController {
    constructor(cocktailService, storageService, drizzle) {
        this.cocktailService = cocktailService;
        this.storageService = storageService;
        this.drizzle = drizzle;
    }
    async initUpload(userId, vpsId, body) {
        if (!body.filename || !body.sizeBytes || !body.destPath) {
            throw new common_1.BadRequestException('Missing filename, sizeBytes, or destPath');
        }
        const [device] = await this.drizzle.db
            .select()
            .from(schema_1.cocktailDevices)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.vpsId, vpsId), (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId)))
            .limit(1);
        if (!device)
            throw new common_1.NotFoundException('No cocktail agent enrolled for this VPS');
        const path = body.destPath;
        if (path.includes('..') || path.startsWith('/root')) {
        }
        const uploadId = crypto.randomUUID();
        const objectKey = `uploads/vps/${vpsId}/${uploadId}/${body.filename}`;
        const [upload] = await this.drizzle.db
            .insert(schema_1.cocktailUploads)
            .values({
            id: uploadId,
            userId,
            vpsId,
            deviceId: device.id,
            objectKey,
            filename: body.filename,
            sizeBytes: body.sizeBytes,
            mimeType: body.mimeType,
            destPath: body.destPath,
            status: 'INIT'
        })
            .returning();
        const putUrl = await this.storageService.getPresignedPutUrl(objectKey, body.mimeType || 'application/octet-stream');
        return {
            uploadId: upload.id,
            objectKey,
            putUrl,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
    }
    async completeUpload(userId, vpsId, uploadId, body) {
        const [upload] = await this.drizzle.db
            .select()
            .from(schema_1.cocktailUploads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailUploads.id, uploadId), (0, drizzle_orm_1.eq)(schema_1.cocktailUploads.userId, userId)))
            .limit(1);
        if (!upload)
            throw new common_1.NotFoundException('Upload not found');
        await this.drizzle.db
            .update(schema_1.cocktailUploads)
            .set({
            status: 'UPLOADED',
            sha256: body.sha256,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailUploads.id, uploadId));
        const getUrl = await this.storageService.getPresignedGetUrl(upload.objectKey, 1800);
        const task = await this.cocktailService.createTask(userId, upload.deviceId, 'FILE_DOWNLOAD_FROM_R2', {
            uploadId: upload.id,
            getUrl,
            destPath: upload.destPath,
            sizeBytes: upload.sizeBytes,
            sha256: body.sha256 || upload.sha256,
            mode: body.mode || '0644'
        });
        await this.drizzle.db
            .update(schema_1.cocktailUploads)
            .set({ taskId: task.id, status: 'TASKED' })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailUploads.id, uploadId));
        return { taskId: task.id };
    }
    async getStatus(userId, uploadId) {
        const [result] = await this.drizzle.db
            .select({
            upload: schema_1.cocktailUploads,
            task: schema_1.cocktailTasks
        })
            .from(schema_1.cocktailUploads)
            .leftJoin(schema_1.cocktailTasks, (0, drizzle_orm_1.eq)(schema_1.cocktailUploads.taskId, schema_1.cocktailTasks.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailUploads.id, uploadId), (0, drizzle_orm_1.eq)(schema_1.cocktailUploads.userId, userId)))
            .limit(1);
        if (!result)
            throw new common_1.NotFoundException('Upload not found');
        return result;
    }
};
exports.CocktailUploadsController = CocktailUploadsController;
__decorate([
    (0, common_1.Post)('init'),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize R2 upload session' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('vpsId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailUploadsController.prototype, "initUpload", null);
__decorate([
    (0, common_1.Post)(':uploadId/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Finalize upload and trigger agent pull' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('vpsId')),
    __param(2, (0, common_1.Param)('uploadId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailUploadsController.prototype, "completeUpload", null);
__decorate([
    (0, common_1.Get)(':uploadId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get upload and task status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('uploadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CocktailUploadsController.prototype, "getStatus", null);
exports.CocktailUploadsController = CocktailUploadsController = __decorate([
    (0, swagger_1.ApiTags)('Cocktail Uploads'),
    (0, common_1.Controller)('cockpit/vps/:vpsId/uploads'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [cocktail_service_1.CocktailService,
        storage_service_1.StorageService,
        drizzle_service_1.DrizzleService])
], CocktailUploadsController);
//# sourceMappingURL=cocktail.uploads.controller.js.map