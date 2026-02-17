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
exports.WallpaperController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cockpit_service_1 = require("./cockpit.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const current_user_decorator_1 = require("../../platform/http/decorators/current-user.decorator");
let WallpaperController = class WallpaperController {
    constructor(cockpitService) {
        this.cockpitService = cockpitService;
    }
    async getWallpaper(userId) {
        return this.cockpitService.getWallpaper(userId);
    }
    async updateWallpaper(userId, wallpaperId) {
        return this.cockpitService.updateWallpaper(userId, wallpaperId);
    }
};
exports.WallpaperController = WallpaperController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current wallpaper' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current wallpaper ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WallpaperController.prototype, "getWallpaper", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update wallpaper' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallpaper updated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)('wallpaperId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], WallpaperController.prototype, "updateWallpaper", null);
exports.WallpaperController = WallpaperController = __decorate([
    (0, swagger_1.ApiTags)('Cockpit Wallpaper'),
    (0, common_1.Controller)('cockpit/wallpaper'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [cockpit_service_1.CockpitService])
], WallpaperController);
//# sourceMappingURL=wallpaper.controller.js.map