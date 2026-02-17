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
exports.CocktailDeviceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cocktail_service_1 = require("./cocktail.service");
const cocktail_auth_1 = require("./cocktail.auth");
const throttler_1 = require("@nestjs/throttler");
let CocktailDeviceController = class CocktailDeviceController {
    constructor(cocktailService) {
        this.cocktailService = cocktailService;
    }
    async finishEnrollment(body) {
        return this.cocktailService.finishEnrollment(body);
    }
    async heartbeat(req, body) {
        return this.cocktailService.updateHeartbeat(req.device.id, body);
    }
    async metrics(req, body) {
        return this.cocktailService.saveMetrics(req.device.id, body);
    }
    async pollTasks(req, body) {
        return this.cocktailService.pollTasks(req.device.id, body.maxTasks);
    }
    async updateTaskStatus(req, taskId, body) {
        return this.cocktailService.updateTaskStatus(req.device.id, taskId, body);
    }
};
exports.CocktailDeviceController = CocktailDeviceController;
__decorate([
    (0, common_1.Post)('enroll/finish'),
    (0, swagger_1.ApiOperation)({ summary: 'Finish device enrollment' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CocktailDeviceController.prototype, "finishEnrollment", null);
__decorate([
    (0, common_1.Post)('heartbeat'),
    (0, common_1.UseGuards)(cocktail_auth_1.CocktailAuthGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-device-id' }),
    (0, swagger_1.ApiHeader)({ name: 'x-signature' }),
    (0, swagger_1.ApiHeader)({ name: 'x-ts' }),
    (0, swagger_1.ApiHeader)({ name: 'x-nonce' }),
    (0, swagger_1.ApiOperation)({ summary: 'Device heartbeat' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CocktailDeviceController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)('metrics'),
    (0, common_1.UseGuards)(cocktail_auth_1.CocktailAuthGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-device-id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Report metrics' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CocktailDeviceController.prototype, "metrics", null);
__decorate([
    (0, common_1.Post)('tasks/poll'),
    (0, common_1.UseGuards)(cocktail_auth_1.CocktailAuthGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-device-id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Poll for tasks' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CocktailDeviceController.prototype, "pollTasks", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/status'),
    (0, common_1.UseGuards)(cocktail_auth_1.CocktailAuthGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-device-id' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update task status' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CocktailDeviceController.prototype, "updateTaskStatus", null);
exports.CocktailDeviceController = CocktailDeviceController = __decorate([
    (0, swagger_1.ApiTags)('Cocktail Device'),
    (0, common_1.Controller)('cockpit/cocktail/device'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [cocktail_service_1.CocktailService])
], CocktailDeviceController);
//# sourceMappingURL=cocktail.device.controller.js.map