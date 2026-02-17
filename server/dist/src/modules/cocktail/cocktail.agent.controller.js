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
exports.CocktailAgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cocktail_service_1 = require("./cocktail.service");
const throttler_1 = require("@nestjs/throttler");
let CocktailAgentController = class CocktailAgentController {
    constructor(cocktailService) {
        this.cocktailService = cocktailService;
    }
    async leaseTask(body) {
        if (!body.deviceId || !body.token)
            throw new common_1.BadRequestException('DeviceId and Token required');
        await this.cocktailService.updateHeartbeat(body.deviceId, { agentVersion: '1.0.0-fast' });
        const result = await this.cocktailService.pollTasks(body.deviceId, 5);
        if (result.tasks.length > 0) {
            const task = result.tasks[0];
            return {
                id: task.id,
                type: task.type,
                payload: task.payload,
                leaseId: result.leaseId
            };
        }
        return null;
    }
    async completeTask(body) {
        await this.cocktailService.updateTaskStatusSimple(body.taskId, body.result, body.error);
        return { success: true };
    }
    async reportMetrics(body) {
        if (!body.deviceId || !body.token || !body.metrics)
            throw new common_1.BadRequestException('DeviceId, Token and Metrics required');
        console.log(`[CocktailAgent] Metrics from ${body.deviceId}:`, JSON.stringify(body.metrics).substring(0, 100) + '...');
        await this.cocktailService.saveMetrics(body.deviceId, body.metrics);
        await this.cocktailService.updateHeartbeat(body.deviceId, {});
    }
    async reportProgress(body) {
        await this.cocktailService.updateTaskProgress(body.taskId, body.progressPct, body.logs);
        return { success: true };
    }
};
exports.CocktailAgentController = CocktailAgentController;
__decorate([
    (0, common_1.Post)('lease-task'),
    (0, swagger_1.ApiOperation)({ summary: 'Agent polls for tasks using enrollment token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CocktailAgentController.prototype, "leaseTask", null);
__decorate([
    (0, common_1.Post)('complete-task'),
    (0, swagger_1.ApiOperation)({ summary: 'Agent reports task completion' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CocktailAgentController.prototype, "completeTask", null);
__decorate([
    (0, common_1.Post)('report-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Agent reports real-time metrics' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CocktailAgentController.prototype, "reportMetrics", null);
__decorate([
    (0, common_1.Post)('task-progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Agent reports task progress' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CocktailAgentController.prototype, "reportProgress", null);
exports.CocktailAgentController = CocktailAgentController = __decorate([
    (0, swagger_1.ApiTags)('Cocktail Agent (Fast)'),
    (0, common_1.Controller)('cockpit/cocktail'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [cocktail_service_1.CocktailService])
], CocktailAgentController);
//# sourceMappingURL=cocktail.agent.controller.js.map