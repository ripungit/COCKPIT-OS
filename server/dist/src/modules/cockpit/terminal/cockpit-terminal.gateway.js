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
var CockpitTerminalGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CockpitTerminalGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const cookie_1 = require("cookie");
const cockpit_terminal_service_1 = require("./cockpit-terminal.service");
const drizzle_service_1 = require("../../../db/drizzle/drizzle.service");
const schema_1 = require("../../../db/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const ssh2_1 = require("ssh2");
const cookie_constants_1 = require("../../../platform/security/cookies/cookie.constants");
let CockpitTerminalGateway = CockpitTerminalGateway_1 = class CockpitTerminalGateway {
    constructor(terminalService, drizzle) {
        this.terminalService = terminalService;
        this.drizzle = drizzle;
        this.logger = new common_1.Logger(CockpitTerminalGateway_1.name);
    }
    async handleConnection(client, request) {
        this.logger.log(`Client connecting... IP: ${request.socket.remoteAddress}`);
        this.logger.log(`Headers: ${JSON.stringify(request.headers)}`);
        this.logger.log(`URL: ${request.url}`);
        try {
            const cookieHeader = request.headers.cookie || '';
            this.logger.log(`Cookie Header: ${cookieHeader}`);
            const cookies = (0, cookie_1.parse)(cookieHeader);
            let userSessionId = cookies[cookie_constants_1.COOKIE_NAMES.SESSION];
            const urlObj = new URL(request.url || '', 'http://localhost');
            const queryParams = urlObj.searchParams;
            if (!userSessionId) {
                userSessionId = queryParams.get('sessionId') || undefined;
            }
            if (!userSessionId) {
                this.logger.warn('Connection attempt without session cookie or query param');
                client.close(1008, 'Authentication required');
                return;
            }
            const [userSession] = await this.drizzle.db
                .select()
                .from(schema_1.sessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sessions.id, userSessionId), (0, drizzle_orm_1.isNull)(schema_1.sessions.revokedAt), (0, drizzle_orm_1.gt)(schema_1.sessions.expiresAt, new Date())));
            if (!userSession) {
                this.logger.warn(`Invalid session ID: ${userSessionId}`);
                client.close(1008, 'Invalid session');
                return;
            }
            const terminalSessionId = queryParams.get('id');
            if (!terminalSessionId) {
                this.logger.warn('Missing terminal session ID in query params');
                client.close(1008, 'Missing terminal session ID');
                return;
            }
            const vpsConfig = await this.terminalService.getVpsCredentials(terminalSessionId, userSession.userId);
            if (!vpsConfig) {
                this.logger.warn(`Terminal session not found or unauthorized: ${terminalSessionId} for user ${userSession.userId}`);
                client.close(1008, 'Session not found or expired');
                return;
            }
            const cwd = queryParams.get('cwd');
            this.logger.log(`Starting SSH connection for session ${terminalSessionId} to ${vpsConfig.host} (CWD: ${cwd || 'default'})`);
            this.handleSshConnection(client, vpsConfig, terminalSessionId, cwd);
            await this.terminalService.markConnected(terminalSessionId);
        }
        catch (error) {
            this.logger.error('Connection handling error', error);
            try {
                client.send(JSON.stringify({ type: 'error', message: 'Internal server error during connection setup' }));
            }
            catch { }
            client.close(1011, 'Internal server error');
        }
    }
    handleDisconnect(client) {
    }
    handleSshConnection(client, vps, sessionId, cwd) {
        const conn = new ssh2_1.Client();
        let stream = null;
        const cleanup = () => {
            try {
                if (stream)
                    stream.end();
            }
            catch { }
            try {
                conn.end();
            }
            catch { }
            try {
                this.terminalService.markClosed(sessionId);
            }
            catch { }
        };
        client.on('close', () => {
            cleanup();
        });
        client.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'init') {
                    if (stream) {
                        stream.setWindow(msg.rows, msg.cols, 0, 0);
                    }
                }
                else if (msg.type === 'resize') {
                    if (stream) {
                        stream.setWindow(msg.rows, msg.cols, 0, 0);
                    }
                }
                else if (msg.type === 'input') {
                    if (stream) {
                        stream.write(msg.data);
                    }
                }
                else if (msg.type === 'ping') {
                    client.send(JSON.stringify({ type: 'pong' }));
                }
            }
            catch (e) {
                this.logger.warn('Received non-JSON message from client', e);
            }
        });
        conn.on('ready', () => {
            client.send(JSON.stringify({ type: 'ready' }));
            conn.shell({ term: 'xterm-256color' }, (err, s) => {
                if (err) {
                    client.send(JSON.stringify({ type: 'error', code: 'SHELL_ERROR', message: err.message }));
                    conn.end();
                    return;
                }
                stream = s;
                if (cwd) {
                    stream.write(`cd "${cwd}" && clear\n`);
                }
                stream.on('data', (d) => {
                    client.send(JSON.stringify({ type: 'output', data: d.toString('utf8') }));
                });
                stream.on('close', () => {
                    client.send(JSON.stringify({ type: 'exit', code: 0 }));
                    conn.end();
                    client.close();
                });
            });
        });
        conn.on('error', (err) => {
            this.logger.error(`SSH Error for session ${sessionId}: ${err.message}`);
            try {
                client.send(JSON.stringify({ type: 'error', message: `SSH Connection Error: ${err.message}` }));
            }
            catch { }
            conn.end();
            client.close();
        });
        conn.on('close', () => {
            client.close();
            this.terminalService.markClosed(sessionId);
        });
        try {
            conn.connect({
                host: vps.host,
                port: vps.port,
                username: vps.username,
                password: vps.password,
                readyTimeout: 30000,
                keepaliveInterval: 5000,
                keepaliveCountMax: 10,
                algorithms: {
                    serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'ssh-rsa', 'ssh-dss'],
                },
                hostHash: 'sha256',
                hostVerifier: (hash) => {
                    const hexParams = hash;
                    const base64Hash = Buffer.from(hexParams, 'hex').toString('base64');
                    const fingerprint = `SHA256:${base64Hash}`;
                    if (vps.serverFingerprint && vps.serverFingerprint !== fingerprint) {
                        client.send(JSON.stringify({
                            type: 'error',
                            code: 'HOST_KEY_CHANGED',
                            message: 'Remote host key has changed!',
                            storedFingerprint: vps.serverFingerprint,
                            newFingerprint: fingerprint
                        }));
                        return false;
                    }
                    return true;
                }
            });
        }
        catch (err) {
            client.send(JSON.stringify({ type: 'error', message: 'Connection failed' }));
            client.close();
        }
    }
};
exports.CockpitTerminalGateway = CockpitTerminalGateway;
exports.CockpitTerminalGateway = CockpitTerminalGateway = CockpitTerminalGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        path: '/cockpit/terminal/ws',
        transports: ['websocket'],
        cors: {
            origin: true,
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [cockpit_terminal_service_1.CockpitTerminalService,
        drizzle_service_1.DrizzleService])
], CockpitTerminalGateway);
//# sourceMappingURL=cockpit-terminal.gateway.js.map