"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cookie_service_1 = require("./cookie.service");
let CookieModule = class CookieModule {
};
exports.CookieModule = CookieModule;
exports.CookieModule = CookieModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [cookie_service_1.CookieService],
        exports: [cookie_service_1.CookieService],
    })
], CookieModule);
//# sourceMappingURL=cookie.module.js.map