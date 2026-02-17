"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./config/config.module");
const logging_module_1 = require("./platform/logging/logging.module");
const http_module_1 = require("./platform/http/http.module");
const db_module_1 = require("./db/db.module");
const health_module_1 = require("./modules/health/health.module");
const auth_module_1 = require("./modules/auth/auth.module");
const auth_module_2 = require("./platform/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const cockpit_module_1 = require("./modules/cockpit/cockpit.module");
const cocktail_module_1 = require("./modules/cocktail/cocktail.module");
const mail_module_1 = require("./modules/mail/mail.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            logging_module_1.LoggingModule,
            http_module_1.HttpModule,
            db_module_1.DbModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            auth_module_2.PlatformAuthModule,
            users_module_1.UsersModule,
            cockpit_module_1.CockpitModule,
            cocktail_module_1.CocktailModule,
            mail_module_1.MailModule,
        ],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map