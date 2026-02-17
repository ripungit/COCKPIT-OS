"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAuthModule = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("./services/token.service");
const bearer_auth_guard_1 = require("./guards/bearer-auth.guard");
const agent_auth_guard_1 = require("./guards/agent-auth.guard");
const security_module_1 = require("../security/security.module");
let PlatformAuthModule = class PlatformAuthModule {
};
exports.PlatformAuthModule = PlatformAuthModule;
exports.PlatformAuthModule = PlatformAuthModule = __decorate([
    (0, common_1.Module)({
        imports: [security_module_1.SecurityModule],
        providers: [token_service_1.TokenService, bearer_auth_guard_1.BearerAuthGuard, agent_auth_guard_1.AgentAuthGuard],
        exports: [token_service_1.TokenService, bearer_auth_guard_1.BearerAuthGuard, agent_auth_guard_1.AgentAuthGuard],
    })
], PlatformAuthModule);
//# sourceMappingURL=auth.module.js.map