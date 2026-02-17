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
exports.CocktailTransfersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cocktail_service_1 = require("./cocktail.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const cocktail_auth_1 = require("./cocktail.auth");
const throttler_1 = require("@nestjs/throttler");
const fs = __importStar(require("fs"));
const path_1 = require("path");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../db/drizzle/schema");
const storage_service_1 = require("./storage.service");
const path = __importStar(require("path"));
let CocktailTransfersController = class CocktailTransfersController {
    constructor(cocktailService, storageService) {
        this.cocktailService = cocktailService;
        this.storageService = storageService;
    }
    async initUpload(req, body) {
        if (!body.deviceId || !body.path)
            throw new common_1.BadRequestException('Missing deviceId or path');
        const transfer = await this.cocktailService.initTransfer(req.user.id, body.deviceId, 'upload', body.path, body.sizeBytes);
        return {
            transferId: transfer.id,
            uploadUrl: `/cockpit/cocktail/transfers/${transfer.id}/upload`
        };
    }
    async uploadFromBrowser(req, transferId) {
        const transfer = await this.cocktailService.getTransferForUser(transferId, req.user.id);
        if (transfer.type !== 'upload')
            throw new common_1.BadRequestException('Not an upload transfer');
        const tempDir = (0, path_1.join)(process.cwd(), 'upload_temp');
        if (!fs.existsSync(tempDir))
            fs.mkdirSync(tempDir, { recursive: true });
        const tempPath = (0, path_1.join)(tempDir, transferId);
        const writeStream = fs.createWriteStream(tempPath);
        await new Promise((resolve, reject) => {
            req.pipe(writeStream);
            writeStream.on('finish', () => resolve(true));
            writeStream.on('error', (err) => {
                console.error("Upload write error:", err);
                reject(new common_1.BadRequestException('Failed to write upload data'));
            });
        });
        const finalSize = fs.statSync(tempPath).size;
        const db = this.cocktailService.drizzle.db;
        await db.update(schema_1.cocktailTransfers)
            .set({ sizeBytes: finalSize, status: 'done' })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTransfers.id, transferId));
        const serverUrl = process.env.API_PUBLIC_URL || 'http://localhost:9100';
        await this.cocktailService.createTask(req.user.id, transfer.deviceId, 'fs.pull_from_server', {
            transferId: transfer.id,
            path: transfer.path,
            downloadUrl: `${serverUrl}/cockpit/cocktail/device/transfers/${transfer.id}/agent-download`
        });
        return { success: true };
    }
    async initDownload(req, body) {
        if (!body.deviceId || !body.path)
            throw new common_1.BadRequestException('Missing deviceId or path');
        const key = `transfers/${req.user.id}/${body.deviceId}/${Date.now()}-${path.basename(body.path)}`;
        const putUrl = await this.storageService.getPresignedPutUrl(key, 'application/octet-stream');
        const getUrl = await this.storageService.getPresignedGetUrl(key);
        const task = await this.cocktailService.createTask(req.user.id, body.deviceId, 'FILE_UPLOAD_TO_R2', {
            path: body.path,
            putUrl,
            key
        });
        return {
            taskId: task.id,
            downloadUrl: getUrl,
            transferId: task.id,
            status: 'pending'
        };
    }
    async downloadToBrowser(req, transferId) {
        const transfer = await this.cocktailService.getTransferForUser(transferId, req.user.id);
        const tempPath = (0, path_1.join)(process.cwd(), 'upload_temp', transferId);
        if (!fs.existsSync(tempPath)) {
            if (transfer.status === 'pending')
                throw new common_1.BadRequestException('File not yet received from agent');
            throw new common_1.NotFoundException('File lost');
        }
        const file = fs.createReadStream(tempPath);
        return new common_1.StreamableFile(file);
    }
    async agentUpload(req, transferId) {
        await this.cocktailService.getTransferForAgent(transferId, req.device.id);
        const tempDir = (0, path_1.join)(process.cwd(), 'upload_temp');
        if (!fs.existsSync(tempDir))
            fs.mkdirSync(tempDir);
        const tempPath = (0, path_1.join)(tempDir, transferId);
        const writeStream = fs.createWriteStream(tempPath);
        return new Promise((resolve, reject) => {
            req.pipe(writeStream);
            writeStream.on('finish', async () => {
                const db = this.cocktailService['drizzle'].db;
                await db.update(schema_1.cocktailTransfers)
                    .set({ status: 'done', sizeBytes: fs.statSync(tempPath).size })
                    .where((0, drizzle_orm_1.eq)(schema_1.cocktailTransfers.id, transferId));
                resolve({ success: true });
            });
            writeStream.on('error', (err) => {
                reject(new common_1.BadRequestException('Upload stream failed'));
            });
        });
    }
    async agentDownload(req, transferId) {
        await this.cocktailService.getTransferForAgent(transferId, req.device.id);
        const tempPath = (0, path_1.join)(process.cwd(), 'upload_temp', transferId);
        if (!fs.existsSync(tempPath))
            throw new common_1.NotFoundException('File not found on server');
        const file = fs.createReadStream(tempPath);
        return new common_1.StreamableFile(file);
    }
};
exports.CocktailTransfersController = CocktailTransfersController;
__decorate([
    (0, common_1.Post)('transfers/upload/init'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize upload session (Browser -> Server)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CocktailTransfersController.prototype, "initUpload", null);
__decorate([
    (0, common_1.Put)('transfers/:transferId/upload'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Browser uploads file content to server' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('transferId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CocktailTransfersController.prototype, "uploadFromBrowser", null);
__decorate([
    (0, common_1.Post)('transfers/download/init'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize download session (VPS -> Browser) via R2' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CocktailTransfersController.prototype, "initDownload", null);
__decorate([
    (0, common_1.Get)('transfers/:transferId/download'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Browser downloads file' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('transferId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CocktailTransfersController.prototype, "downloadToBrowser", null);
__decorate([
    (0, common_1.Post)('transfers/:transferId/agent-upload'),
    (0, common_1.UseGuards)(cocktail_auth_1.CocktailAuthGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-device-id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Agent uploads file content to server (for user download)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('transferId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CocktailTransfersController.prototype, "agentUpload", null);
__decorate([
    (0, common_1.Get)('transfers/:transferId/agent-download'),
    (0, common_1.UseGuards)(cocktail_auth_1.CocktailAuthGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-device-id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Agent downloads file content from server (uploaded by user)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('transferId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CocktailTransfersController.prototype, "agentDownload", null);
exports.CocktailTransfersController = CocktailTransfersController = __decorate([
    (0, swagger_1.ApiTags)('Cocktail Transfers'),
    (0, common_1.Controller)('cockpit/cocktail'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [cocktail_service_1.CocktailService,
        storage_service_1.StorageService])
], CocktailTransfersController);
//# sourceMappingURL=cocktail.transfers.controller.js.map