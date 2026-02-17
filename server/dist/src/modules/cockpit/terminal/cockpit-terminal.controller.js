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
exports.CockpitTerminalController = void 0;
const common_1 = require("@nestjs/common");
const cockpit_terminal_service_1 = require("./cockpit-terminal.service");
const session_guard_1 = require("../../../platform/http/guards/session.guard");
let CockpitTerminalController = class CockpitTerminalController {
    constructor(terminalService) {
        this.terminalService = terminalService;
    }
    async createSession(req, vpsId) {
        const user = req.user;
        if (!user) {
            throw new common_1.BadRequestException('User not authenticated');
        }
        const userId = user.id;
        return this.terminalService.createSession(userId, vpsId);
    }
    async closeSession(req, vpsId, sessionId) {
        const user = req.user;
        if (!user) {
            throw new common_1.BadRequestException('User not authenticated');
        }
        const userId = user.id;
        await this.terminalService.markClosed(sessionId);
        return { ok: true };
    }
};
exports.CockpitTerminalController = CockpitTerminalController;
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('vpsId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CockpitTerminalController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('vpsId')),
    __param(2, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CockpitTerminalController.prototype, "closeSession", null);
exports.CockpitTerminalController = CockpitTerminalController = __decorate([
    (0, common_1.Controller)('cockpit/vps/:vpsId/terminal'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __metadata("design:paramtypes", [cockpit_terminal_service_1.CockpitTerminalService])
], CockpitTerminalController);
//# sourceMappingURL=cockpit-terminal.controller.js.map