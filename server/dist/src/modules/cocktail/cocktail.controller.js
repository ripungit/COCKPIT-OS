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
exports.CocktailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cocktail_service_1 = require("./cocktail.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const throttler_1 = require("@nestjs/throttler");
let CocktailController = class CocktailController {
    constructor(cocktailService) {
        this.cocktailService = cocktailService;
    }
    async startEnrollment(req, body) {
        return this.cocktailService.startEnrollment(req.user.id, body.vpsId);
    }
    async getDevices(req) {
        return this.cocktailService.getDevices(req.user.id);
    }
    async getDevice(req, deviceId) {
        return this.cocktailService.getDevice(req.user.id, deviceId);
    }
    async disableDevice(req, deviceId) {
        return this.cocktailService.disableDevice(req.user.id, deviceId);
    }
    async createTask(req, deviceId, body) {
        return this.cocktailService.createTask(req.user.id, deviceId, body.type, body.payload);
    }
    async listTasks(req, deviceId, limit) {
        return this.cocktailService.listTasks(req.user.id, deviceId, limit ? Number(limit) : 50);
    }
    async getLatestMetrics(req, deviceId) {
        return this.cocktailService.getLatestMetrics(req.user.id, deviceId);
    }
    async getProcessList(req, deviceId, body) {
        return this.cocktailService.getProcessList(req.user.id, deviceId, body);
    }
    async killProcess(req, deviceId, body) {
        return this.cocktailService.killProcess(req.user.id, deviceId, body.pid, body.signal || 'SIGTERM', body.force || false);
    }
    async runBooster(req, deviceId, body) {
        return this.cocktailService.runBooster(req.user.id, deviceId, body.actions, body.dryRun || false);
    }
};
exports.CocktailController = CocktailController;
__decorate([
    (0, common_1.Post)('devices/enroll/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start device enrollment' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "startEnrollment", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, swagger_1.ApiOperation)({ summary: 'List user devices' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get device details' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "getDevice", null);
__decorate([
    (0, common_1.Post)('devices/:deviceId/disable'),
    (0, swagger_1.ApiOperation)({ summary: 'Disable device' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "disableDevice", null);
__decorate([
    (0, common_1.Post)('devices/:deviceId/tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Create task for device' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId/tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'List tasks for device' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId/metrics/latest'),
    (0, swagger_1.ApiOperation)({ summary: 'Get latest metrics for device' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "getLatestMetrics", null);
__decorate([
    (0, common_1.Post)('devices/:deviceId/proc/list'),
    (0, swagger_1.ApiOperation)({ summary: 'List processes for device' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "getProcessList", null);
__decorate([
    (0, common_1.Post)('devices/:deviceId/proc/kill'),
    (0, swagger_1.ApiOperation)({ summary: 'Kill a process on device' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "killProcess", null);
__decorate([
    (0, common_1.Post)('devices/:deviceId/boost/run'),
    (0, swagger_1.ApiOperation)({ summary: 'Run system booster tasks' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailController.prototype, "runBooster", null);
exports.CocktailController = CocktailController = __decorate([
    (0, swagger_1.ApiTags)('Cocktail User'),
    (0, common_1.Controller)('cockpit/cocktail'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [cocktail_service_1.CocktailService])
], CocktailController);
//# sourceMappingURL=cocktail.controller.js.map