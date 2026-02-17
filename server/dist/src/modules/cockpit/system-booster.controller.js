"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemBoosterController = void 0;
const common_1 = require("@nestjs/common");
const session_guard_1 = require("../../platform/http/guards/session.guard");
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = __importStar(require("os"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let SystemBoosterController = class SystemBoosterController {
    async boostSystem() {
        const initialFreeMem = os.freemem();
        try {
            if (process.platform === 'linux') {
                await execAsync('sync; echo 3 > /proc/sys/vm/drop_caches').catch(() => { });
            }
            if (global.gc) {
                global.gc();
            }
        }
        catch (e) {
            console.error('Boost error:', e);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        const finalFreeMem = os.freemem();
        const diffBytes = finalFreeMem - initialFreeMem;
        const freedMB = Math.max(0, Math.round(diffBytes / 1024 / 1024));
        return {
            success: true,
            freedMB: freedMB,
            platform: process.platform
        };
    }
};
exports.SystemBoosterController = SystemBoosterController;
__decorate([
    (0, common_1.Post)('boost'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemBoosterController.prototype, "boostSystem", null);
exports.SystemBoosterController = SystemBoosterController = __decorate([
    (0, common_1.Controller)('cockpit/system'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard)
], SystemBoosterController);
//# sourceMappingURL=system-booster.controller.js.map