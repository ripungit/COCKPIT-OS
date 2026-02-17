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
exports.CockpitController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cockpit_service_1 = require("./cockpit.service");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const current_user_decorator_1 = require("../../platform/http/decorators/current-user.decorator");
const create_vps_dto_1 = require("./dto/create-vps.dto");
const update_vps_dto_1 = require("./dto/update-vps.dto");
const accept_host_key_dto_1 = require("./dto/accept-host-key.dto");
let CockpitController = class CockpitController {
    constructor(cockpitService) {
        this.cockpitService = cockpitService;
    }
    async create(userId, dto) {
        return this.cockpitService.createVps(userId, dto);
    }
    async findAll(userId) {
        return this.cockpitService.findAllVps(userId);
    }
    async findOne(userId, vpsId) {
        return this.cockpitService.findOneVps(userId, vpsId);
    }
    async update(userId, vpsId, dto) {
        return this.cockpitService.updateVps(userId, vpsId, dto);
    }
    async delete(userId, vpsId) {
        return this.cockpitService.deleteVps(userId, vpsId);
    }
    async verify(userId, vpsId) {
        return this.cockpitService.verifyVps(userId, vpsId);
    }
    async acceptHostKey(userId, vpsId, body) {
        return this.cockpitService.acceptHostKey(userId, vpsId, body.fingerprint);
    }
};
exports.CockpitController = CockpitController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new VPS connection' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'VPS created' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_vps_dto_1.CreateVpsDto]),
    __metadata("design:returntype", Promise)
], CockpitController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all VPS connections for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of VPS' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CockpitController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get VPS details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'VPS details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CockpitController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update VPS details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated VPS' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_vps_dto_1.UpdateVpsDto]),
    __metadata("design:returntype", Promise)
], CockpitController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a VPS' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'VPS deleted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CockpitController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify SSH connectivity' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification result' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CockpitController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)(':id/hostkey/accept'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Accept new host key fingerprint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Host key accepted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, accept_host_key_dto_1.AcceptHostKeyDto]),
    __metadata("design:returntype", Promise)
], CockpitController.prototype, "acceptHostKey", null);
exports.CockpitController = CockpitController = __decorate([
    (0, swagger_1.ApiTags)('Cockpit'),
    (0, common_1.Controller)('cockpit/vps'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [cockpit_service_1.CockpitService])
], CockpitController);
//# sourceMappingURL=cockpit.controller.js.map