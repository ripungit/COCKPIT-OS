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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocktailFsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cocktail_service_1 = require("./cocktail.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const throttler_1 = require("@nestjs/throttler");
let CocktailFsController = class CocktailFsController {
    constructor(cocktailService) {
        this.cocktailService = cocktailService;
    }
    async list(req, deviceId, body) {
        if (!body.path)
            throw new common_1.BadRequestException('Path required');
        const items = await this.cocktailService.getFsListCached(req.user.id, deviceId, body.path, body.showHidden);
        return { items };
    }
    async listGet(req, deviceId, path) {
        return this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.list', {
            path: path || '/',
            showHidden: false
        });
    }
    async stat(req, deviceId, body) {
        if (!body.path)
            throw new common_1.BadRequestException('Path required');
        return this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.stat', {
            path: body.path
        });
    }
    async readText(req, deviceId, body) {
        if (!body.path)
            throw new common_1.BadRequestException('Path required');
        return this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.read_text', {
            path: body.path,
            maxBytes: body.maxBytes || 256 * 1024
        });
    }
    async writeText(req, deviceId, body) {
        if (!body.path || body.content === undefined)
            throw new common_1.BadRequestException('Path and content required');
        const res = await this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.write_text', {
            path: body.path,
            content: body.content,
            mode: body.mode
        });
        await this.cocktailService.invalidateFsCache(deviceId, body.path);
        return res;
    }
    async mkdir(req, deviceId, body) {
        if (!body.path)
            throw new common_1.BadRequestException('Path required');
        const res = await this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.mkdir', {
            path: body.path,
            recursive: body.recursive ?? true
        });
        await this.cocktailService.invalidateFsCache(deviceId, body.path);
        return res;
    }
    async delete(req, deviceId, body) {
        if (!body.path)
            throw new common_1.BadRequestException('Path required');
        const res = await this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.delete', {
            path: body.path,
            recursive: body.recursive
        });
        await this.cocktailService.invalidateFsCache(deviceId, body.path);
        return res;
    }
    async move(req, deviceId, body) {
        if (!body.from || !body.to)
            throw new common_1.BadRequestException('Source and destination required');
        const res = await this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.move', {
            from: body.from,
            to: body.to
        });
        await this.cocktailService.invalidateFsCache(deviceId, body.from);
        await this.cocktailService.invalidateFsCache(deviceId, body.to);
        return res;
    }
    async search(req, deviceId, body) {
        if (!body.query)
            throw new common_1.BadRequestException('Query required');
        return this.cocktailService.executeTaskSync(req.user.id, deviceId, 'fs.search', {
            root: body.root || '/',
            query: body.query,
            maxResults: body.maxResults || 200
        });
    }
};
exports.CocktailFsController = CocktailFsController;
__decorate([
    (0, common_1.Post)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'List directory contents' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'List directory contents (GET for debug)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Query)('path')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "listGet", null);
__decorate([
    (0, common_1.Post)('stat'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file stats' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "stat", null);
__decorate([
    (0, common_1.Post)('read-text'),
    (0, swagger_1.ApiOperation)({ summary: 'Read text file' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "readText", null);
__decorate([
    (0, common_1.Post)('write-text'),
    (0, swagger_1.ApiOperation)({ summary: 'Write text file' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "writeText", null);
__decorate([
    (0, common_1.Post)('mkdir'),
    (0, swagger_1.ApiOperation)({ summary: 'Create directory' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "mkdir", null);
__decorate([
    (0, common_1.Post)('delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete file or directory' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('move'),
    (0, swagger_1.ApiOperation)({ summary: 'Move/Rename file' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "move", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search files' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailFsController.prototype, "search", null);
exports.CocktailFsController = CocktailFsController = __decorate([
    (0, swagger_1.ApiTags)('Cocktail File System'),
    (0, common_1.Controller)('cocktail-fs/:deviceId'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [cocktail_service_1.CocktailService])
], CocktailFsController);
//# sourceMappingURL=cocktail.fs.controller.js.map