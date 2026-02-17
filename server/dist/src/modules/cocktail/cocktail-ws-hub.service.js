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
var CocktailWsHub_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocktailWsHub = void 0;
const common_1 = require("@nestjs/common");
const ws_1 = require("ws");
let CocktailWsHub = CocktailWsHub_1 = class CocktailWsHub {
    constructor() {
        this.logger = new common_1.Logger(CocktailWsHub_1.name);
        this.agents = new Map();
        this.uiByDevice = new Map();
        this.lastKnownData = new Map();
        setInterval(() => this.heartbeat(), 15_000);
    }
    heartbeat() {
        this.agents.forEach((ws, deviceId) => {
            if (ws.isAlive === false) {
                this.logger.log(`Agent ${deviceId} timed out, terminating.`);
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
        this.uiByDevice.forEach((set, deviceId) => {
            set.forEach((ws) => {
                if (ws.isAlive === false) {
                    set.delete(ws);
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        });
    }
    registerAgent(deviceId, ws) {
        const prev = this.agents.get(deviceId);
        if (prev && prev !== ws) {
            this.logger.log(`Replacing agent socket for ${deviceId}`);
            prev.terminate();
        }
        ws.deviceId = deviceId;
        this.agents.set(deviceId, ws);
        this.broadcastToUi(deviceId, { t: 'metrics', at: new Date().toISOString(), data: { online: true } });
    }
    removeAgent(ws) {
        const deviceId = ws.deviceId;
        if (deviceId && this.agents.get(deviceId) === ws) {
            this.agents.delete(deviceId);
            this.logger.log(`Agent ${deviceId} disconnected`);
            this.broadcastToUi(deviceId, { t: 'metrics', at: new Date().toISOString(), data: { online: false } });
        }
    }
    registerUi(deviceId, ws) {
        ws.deviceId = deviceId;
        ws.topics = new Set();
        if (!this.uiByDevice.has(deviceId)) {
            this.uiByDevice.set(deviceId, new Set());
        }
        this.uiByDevice.get(deviceId).add(ws);
    }
    removeUi(ws) {
        const deviceId = ws.deviceId;
        if (deviceId && this.uiByDevice.has(deviceId)) {
            this.uiByDevice.get(deviceId).delete(ws);
        }
    }
    broadcastToUi(deviceId, msg) {
        if (msg.t === 'net' || msg.t === 'conns') {
            if (!this.lastKnownData.has(deviceId))
                this.lastKnownData.set(deviceId, {});
            this.lastKnownData.get(deviceId)[msg.t] = msg;
        }
        const uis = this.uiByDevice.get(deviceId);
        if (!uis)
            return;
        const payload = JSON.stringify(msg);
        uis.forEach((ui) => {
            if (ui.readyState === ws_1.WebSocket.OPEN) {
                if (ui.topics?.has(msg.t) || msg.t === 'metrics') {
                    ui.send(payload);
                }
            }
        });
    }
    sendInitialCache(deviceId, ws) {
        const cache = this.lastKnownData.get(deviceId);
        if (!cache || ws.readyState !== ws_1.WebSocket.OPEN)
            return;
        Object.values(cache).forEach(msg => {
            if (ws.topics?.has(msg.t)) {
                ws.send(JSON.stringify(msg));
            }
        });
    }
    sendToAgent(deviceId, msg) {
        const agent = this.agents.get(deviceId);
        if (agent && agent.readyState === ws_1.WebSocket.OPEN) {
            agent.send(JSON.stringify(msg));
            return true;
        }
        return false;
    }
};
exports.CocktailWsHub = CocktailWsHub;
exports.CocktailWsHub = CocktailWsHub = CocktailWsHub_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CocktailWsHub);
//# sourceMappingURL=cocktail-ws-hub.service.js.map