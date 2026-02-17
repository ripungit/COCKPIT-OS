"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocktailModule = void 0;
const common_1 = require("@nestjs/common");
const cocktail_controller_1 = require("./cocktail.controller");
const cocktail_device_controller_1 = require("./cocktail.device.controller");
const cocktail_fs_controller_1 = require("./cocktail.fs.controller");
const cocktail_transfers_controller_1 = require("./cocktail.transfers.controller");
const cocktail_agent_controller_1 = require("./cocktail.agent.controller");
const cocktail_service_1 = require("./cocktail.service");
const db_module_1 = require("../../db/db.module");
const config_1 = require("@nestjs/config");
const cocktail_ws_hub_service_1 = require("./cocktail-ws-hub.service");
const cocktail_gateway_1 = require("./cocktail.gateway");
const storage_service_1 = require("./storage.service");
const cocktail_uploads_controller_1 = require("./cocktail.uploads.controller");
let CocktailModule = class CocktailModule {
};
exports.CocktailModule = CocktailModule;
exports.CocktailModule = CocktailModule = __decorate([
    (0, common_1.Module)({
        imports: [db_module_1.DbModule, config_1.ConfigModule],
        controllers: [cocktail_fs_controller_1.CocktailFsController, cocktail_controller_1.CocktailController, cocktail_device_controller_1.CocktailDeviceController, cocktail_transfers_controller_1.CocktailTransfersController, cocktail_agent_controller_1.CocktailAgentController, cocktail_uploads_controller_1.CocktailUploadsController],
        providers: [cocktail_service_1.CocktailService, cocktail_ws_hub_service_1.CocktailWsHub, cocktail_gateway_1.CocktailAgentGateway, cocktail_gateway_1.CocktailUiGateway, storage_service_1.StorageService],
        exports: [cocktail_service_1.CocktailService, storage_service_1.StorageService],
    })
], CocktailModule);
//# sourceMappingURL=cocktail.module.js.map