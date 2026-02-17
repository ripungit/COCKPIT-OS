"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CockpitModule = void 0;
const common_1 = require("@nestjs/common");
const cockpit_controller_1 = require("./cockpit.controller");
const cockpit_service_1 = require("./cockpit.service");
const cockpit_terminal_service_1 = require("./terminal/cockpit-terminal.service");
const cockpit_terminal_controller_1 = require("./terminal/cockpit-terminal.controller");
const cockpit_terminal_gateway_1 = require("./terminal/cockpit-terminal.gateway");
const notes_controller_1 = require("./notes.controller");
const speedtest_controller_1 = require("./speedtest.controller");
const system_booster_controller_1 = require("./system-booster.controller");
const wallpaper_controller_1 = require("./wallpaper.controller");
let CockpitModule = class CockpitModule {
};
exports.CockpitModule = CockpitModule;
exports.CockpitModule = CockpitModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            cockpit_controller_1.CockpitController,
            cockpit_terminal_controller_1.CockpitTerminalController,
            notes_controller_1.NotesController,
            speedtest_controller_1.SpeedtestController,
            system_booster_controller_1.SystemBoosterController,
            wallpaper_controller_1.WallpaperController
        ],
        providers: [cockpit_service_1.CockpitService, cockpit_terminal_service_1.CockpitTerminalService, cockpit_terminal_gateway_1.CockpitTerminalGateway],
        exports: [cockpit_service_1.CockpitService],
    })
], CockpitModule);
//# sourceMappingURL=cockpit.module.js.map