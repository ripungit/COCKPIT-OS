"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const http_module_1 = require("../../platform/http/http.module");
const auth_module_1 = require("../../platform/auth/auth.module");
const security_module_1 = require("../../platform/security/security.module");
const passkeys_service_1 = require("../auth/passkeys/passkeys.service");
const webauthn_service_1 = require("../auth/passkeys/webauthn.service");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [http_module_1.HttpModule, auth_module_1.PlatformAuthModule, security_module_1.SecurityModule],
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService, passkeys_service_1.PasskeysService, webauthn_service_1.WebauthnService],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map