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
var CocktailAgentGateway_1, CocktailUiGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocktailUiGateway = exports.CocktailAgentGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const cookie_1 = require("cookie");
const cookie_constants_1 = require("../../platform/security/cookies/cookie.constants");
const drizzle_service_1 = require("../../db/drizzle/drizzle.service");
const schema_1 = require("../../db/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const cocktail_ws_hub_service_1 = require("./cocktail-ws-hub.service");
const cocktail_service_1 = require("./cocktail.service");
const common_1 = require("@nestjs/common");
let CocktailAgentGateway = CocktailAgentGateway_1 = class CocktailAgentGateway {
    constructor(hub, cocktailService) {
        this.hub = hub;
        this.cocktailService = cocktailService;
        this.logger = new common_1.Logger(CocktailAgentGateway_1.name);
    }
    async handleConnection(client, request) {
        client.isAlive = true;
        client.on('pong', () => (client.isAlive = true));
        client.on('message', async (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                if (msg.t === 'hello') {
                    const { deviceId, token } = msg;
                    if (!deviceId || !token) {
                        client.send(JSON.stringify({ t: 'err', code: 'BAD_HELLO', message: 'Missing deviceId/token' }));
                        return client.close();
                    }
                    const authenticated = await this.cocktailService.authenticateAgent(deviceId, token);
                    if (!authenticated) {
                        client.send(JSON.stringify({ t: 'err', code: 'AUTH_FAILED', message: 'Invalid credentials' }));
                        return client.close();
                    }
                    this.hub.registerAgent(deviceId, client);
                    client.send(JSON.stringify({ t: 'ok', for: 'hello' }));
                    return;
                }
                if (msg.t === 'metrics' || msg.t === 'net' || msg.t === 'conns' || msg.t === 'log' || msg.t === 'ui_boost_log' || msg.t === 'task_progress') {
                    if (client.deviceId) {
                        this.hub.broadcastToUi(client.deviceId, msg);
                    }
                }
            }
            catch (e) {
                this.logger.error('Agent message error', e);
            }
        });
    }
    handleDisconnect(client) {
        this.hub.removeAgent(client);
    }
};
exports.CocktailAgentGateway = CocktailAgentGateway;
exports.CocktailAgentGateway = CocktailAgentGateway = CocktailAgentGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        path: '/cockpit/cocktail/ws/agent',
        transports: ['websocket'],
    }),
    __metadata("design:paramtypes", [cocktail_ws_hub_service_1.CocktailWsHub,
        cocktail_service_1.CocktailService])
], CocktailAgentGateway);
let CocktailUiGateway = CocktailUiGateway_1 = class CocktailUiGateway {
    constructor(hub, drizzle) {
        this.hub = hub;
        this.drizzle = drizzle;
        this.logger = new common_1.Logger(CocktailUiGateway_1.name);
    }
    async handleConnection(client, request) {
        client.isAlive = true;
        client.on('pong', () => (client.isAlive = true));
        try {
            const cookieHeader = request.headers.cookie || '';
            const cookies = (0, cookie_1.parse)(cookieHeader);
            const sessionId = cookies[cookie_constants_1.COOKIE_NAMES.SESSION];
            if (!sessionId) {
                client.close(1008, 'Authentication required');
                return;
            }
            const [session] = await this.drizzle.db
                .select()
                .from(schema_1.sessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId), (0, drizzle_orm_1.isNull)(schema_1.sessions.revokedAt), (0, drizzle_orm_1.gt)(schema_1.sessions.expiresAt, new Date())));
            if (!session) {
                client.close(1008, 'Invalid session');
                return;
            }
            client.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    if (msg.t === 'ui_hello') {
                        this.hub.registerUi(msg.deviceId, client);
                        return;
                    }
                    if (msg.t === 'sub') {
                        msg.topics?.forEach((t) => client.topics?.add(t));
                        if (client.deviceId) {
                            this.hub.sendInitialCache(client.deviceId, client);
                        }
                        return;
                    }
                    if (msg.t === 'unsub') {
                        msg.topics?.forEach((t) => client.topics?.delete(t));
                        return;
                    }
                    if (msg.t === 'log_start' || msg.t === 'log_stop' || msg.t === 'cmd') {
                        if (client.deviceId) {
                            this.hub.sendToAgent(client.deviceId, msg);
                        }
                    }
                }
                catch (e) {
                    this.logger.error('UI message error', e);
                }
            });
        }
        catch (e) {
            this.logger.error('UI connection error', e);
            client.close(1011, 'Internal error');
        }
    }
    handleDisconnect(client) {
        this.hub.removeUi(client);
    }
};
exports.CocktailUiGateway = CocktailUiGateway;
exports.CocktailUiGateway = CocktailUiGateway = CocktailUiGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        path: '/cockpit/cocktail/ws/ui',
        transports: ['websocket'],
    }),
    __metadata("design:paramtypes", [cocktail_ws_hub_service_1.CocktailWsHub,
        drizzle_service_1.DrizzleService])
], CocktailUiGateway);
//# sourceMappingURL=cocktail.gateway.js.map