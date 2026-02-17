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
var CockpitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CockpitService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_service_1 = require("../../db/drizzle/drizzle.service");
const schema_1 = require("../../db/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto = __importStar(require("crypto"));
const ssh2_1 = require("ssh2");
let CockpitService = CockpitService_1 = class CockpitService {
    constructor(drizzle, configService) {
        this.drizzle = drizzle;
        this.configService = configService;
        this.logger = new common_1.Logger(CockpitService_1.name);
        this.algorithm = 'aes-256-gcm';
    }
    sanitizeText(value) {
        if (value === null || value === undefined)
            return null;
        const s = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
        return s.replace(/\u0000/g, '').trim();
    }
    sanitizeJson(obj) {
        if (obj === null || obj === undefined)
            return obj;
        if (typeof obj === 'string') {
            return this.sanitizeText(obj);
        }
        if (Buffer.isBuffer(obj)) {
            return this.sanitizeText(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map((v) => this.sanitizeJson(v));
        }
        if (typeof obj === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(obj)) {
                out[k] = this.sanitizeJson(v);
            }
            return out;
        }
        return obj;
    }
    getEncryptionKey() {
        const key = this.configService.get('COCKPIT_SECRET_KEY');
        if (!key) {
            this.logger.error('COCKPIT_SECRET_KEY is not configured');
            throw new common_1.InternalServerErrorException('COCKPIT_SECRET_KEY is not configured');
        }
        return crypto.createHash('sha256').update(key).digest();
    }
    encryptSecret(plaintext) {
        const iv = crypto.randomBytes(16);
        const key = this.getEncryptionKey();
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag().toString('base64');
        return JSON.stringify({
            iv: iv.toString('base64'),
            content: encrypted,
            tag: authTag,
        });
    }
    decryptSecret(encryptedPayload) {
        try {
            const { iv, content, tag } = JSON.parse(encryptedPayload);
            const key = this.getEncryptionKey();
            const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'base64'));
            decipher.setAuthTag(Buffer.from(tag, 'base64'));
            let decrypted = decipher.update(content, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error('Failed to decrypt secret', error);
            throw new common_1.InternalServerErrorException('Failed to decrypt secret');
        }
    }
    async createVps(userId, dto) {
        const encryptedPassword = this.encryptSecret(dto.password);
        const [vps] = await this.drizzle.db
            .insert(schema_1.cockpitVps)
            .values({
            userId,
            name: dto.name,
            host: dto.host,
            port: dto.port,
            username: dto.username,
            encryptedPassword,
            status: 'pending',
        })
            .returning();
        this.logger.log(`User ${userId} created VPS ${vps.id}`);
        const { encryptedPassword: _, ...safeVps } = vps;
        return safeVps;
    }
    async findAllVps(userId) {
        const list = await this.drizzle.db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.cockpitVps.createdAt));
        return list.map((vps) => {
            const { encryptedPassword: _, ...safe } = vps;
            return safe;
        });
    }
    async findOneVps(userId, vpsId) {
        const [vps] = await this.drizzle.db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId), (0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId)));
        if (!vps) {
            throw new common_1.NotFoundException('VPS not found');
        }
        const { encryptedPassword: _, ...safe } = vps;
        return safe;
    }
    async updateVps(userId, vpsId, dto) {
        const [existing] = await this.drizzle.db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId), (0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId)));
        if (!existing) {
            throw new common_1.NotFoundException('VPS not found');
        }
        const updates = {
            updatedAt: new Date(),
        };
        if (dto.name)
            updates.name = dto.name;
        let connectionChanged = false;
        let hostChanged = false;
        if (dto.host && dto.host !== existing.host) {
            updates.host = dto.host;
            connectionChanged = true;
            hostChanged = true;
        }
        if (dto.port && dto.port !== existing.port) {
            updates.port = dto.port;
            connectionChanged = true;
        }
        if (dto.username && dto.username !== existing.username) {
            updates.username = dto.username;
            connectionChanged = true;
        }
        if (dto.password) {
            updates.encryptedPassword = this.encryptSecret(dto.password);
            connectionChanged = true;
        }
        if (connectionChanged) {
            updates.status = 'pending';
            updates.verifiedAt = null;
            updates.lastError = null;
            if (hostChanged) {
                updates.serverFingerprint = null;
                updates.meta = null;
            }
        }
        const [updated] = await this.drizzle.db
            .update(schema_1.cockpitVps)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId))
            .returning();
        this.logger.log(`User ${userId} updated VPS ${vpsId}`);
        const { encryptedPassword: _, ...safe } = updated;
        return safe;
    }
    async deleteVps(userId, vpsId) {
        const [deleted] = await this.drizzle.db
            .delete(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId), (0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId)))
            .returning();
        if (!deleted) {
            throw new common_1.NotFoundException('VPS not found');
        }
        this.logger.log(`User ${userId} deleted VPS ${vpsId}`);
        return { ok: true };
    }
    async acceptHostKey(userId, vpsId, fingerprint) {
        const [vps] = await this.drizzle.db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId), (0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId)));
        if (!vps) {
            throw new common_1.NotFoundException('VPS not found');
        }
        await this.drizzle.db
            .update(schema_1.cockpitVps)
            .set({
            serverFingerprint: fingerprint,
            status: 'pending',
            lastError: null,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId));
        this.logger.log(`User ${userId} accepted new host key for VPS ${vpsId}: ${fingerprint}`);
        return { ok: true };
    }
    async verifyVps(userId, vpsId) {
        const [vps] = await this.drizzle.db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId), (0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId)));
        if (!vps) {
            throw new common_1.NotFoundException('VPS not found');
        }
        this.logger.log(`User ${userId} verifying VPS ${vpsId} (${vps.host}:${vps.port})`);
        const password = this.decryptSecret(vps.encryptedPassword);
        try {
            return await this.testSshConnection(userId, vpsId, vps, password, vps.port, true);
        }
        catch (error) {
            const errCode = error?.response?.code || error?.code;
            const isNetworkError = errCode === 'SSH_CONNECTION_FAILED' ||
                errCode === 'SSH_TIMEOUT' ||
                errCode === 'ECONNREFUSED' ||
                errCode === 'ETIMEDOUT';
            const isAuthError = errCode === 'SSH_AUTH_FAILED';
            if (isNetworkError && !isAuthError) {
                const commonPorts = [22, 2222, 2022, 22022, 22222];
                const portsToProbe = commonPorts.filter(p => p !== vps.port);
                for (const p of portsToProbe) {
                    try {
                        await this.testSshConnection(userId, vpsId, vps, password, p, false, 2000);
                        throw new common_1.BadRequestException({
                            code: 'SSH_PORT_MISMATCH',
                            message: `SSH is reachable on port ${p}. Update the port and retry.`,
                            suggestedPorts: [p]
                        });
                    }
                    catch (probeErr) {
                        if (probeErr instanceof common_1.BadRequestException) {
                            const response = probeErr.getResponse();
                            if (response.code === 'SSH_PORT_MISMATCH') {
                                throw probeErr;
                            }
                        }
                        const probeCode = probeErr?.response?.code || probeErr?.code;
                        if (probeCode === 'SSH_AUTH_FAILED' || probeCode === 'HOST_KEY_CHANGED') {
                            throw new common_1.BadRequestException({
                                code: 'SSH_PORT_MISMATCH',
                                message: `SSH is reachable on port ${p}. Update the port and retry.`,
                                suggestedPorts: [p]
                            });
                        }
                    }
                }
            }
            throw error;
        }
    }
    async testSshConnection(userId, vpsId, vps, password, port, updateDb, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const conn = new ssh2_1.Client();
            let fingerprint = null;
            let meta = {};
            let errorRecorded = false;
            let hostKeyMismatch = false;
            const cleanup = () => {
                try {
                    conn.end();
                }
                catch { }
            };
            const handleError = async (code, message, details) => {
                if (errorRecorded)
                    return;
                errorRecorded = true;
                const safeMessage = this.sanitizeText(message) ?? 'Unknown error';
                if (updateDb) {
                    this.logger.warn(`VPS ${vpsId} verification failed: [${code}] ${safeMessage}`);
                    try {
                        await this.drizzle.db
                            .update(schema_1.cockpitVps)
                            .set({
                            status: 'failed',
                            lastError: this.sanitizeText(`[${code}] ${safeMessage}`),
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId));
                    }
                    catch (dbErr) {
                        this.logger.error('Failed to persist verification error', dbErr);
                    }
                }
                cleanup();
                reject(new common_1.BadRequestException({
                    code,
                    message: safeMessage,
                    vpsId,
                    ...details
                }));
            };
            conn
                .on('ready', () => {
                const cmd = 'whoami && hostname && uname -m && uname -r && (cat /etc/os-release || echo "PRETTY_NAME=Unknown")';
                conn.exec(cmd, (err, stream) => {
                    if (err) {
                        handleError('EXEC_FAILED', err.message);
                        return;
                    }
                    let output = '';
                    stream.on('data', (data) => {
                        output += Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
                    });
                    stream.on('close', async () => {
                        try {
                            const cleanedOutput = this.sanitizeText(output) ?? '';
                            const lines = cleanedOutput.split('\n');
                            const whoami = this.sanitizeText(lines[0]);
                            const hostname = this.sanitizeText(lines[1]);
                            const arch = this.sanitizeText(lines[2]);
                            const kernel = this.sanitizeText(lines[3]);
                            const osRelease = lines.slice(4).join('\n');
                            const prettyNameMatch = osRelease.match(/PRETTY_NAME="?([^"\n]+)"?/);
                            const osPretty = this.sanitizeText(prettyNameMatch ? prettyNameMatch[1] : 'Unknown');
                            meta = this.sanitizeJson({
                                whoami,
                                hostname,
                                arch,
                                kernel,
                                os: osPretty,
                            });
                            if (updateDb) {
                                this.logger.log(`VPS ${vpsId} verified successfully. Hostname: ${hostname ?? 'unknown'}`);
                                await this.drizzle.db
                                    .update(schema_1.cockpitVps)
                                    .set({
                                    status: 'verified',
                                    verifiedAt: new Date(),
                                    lastError: null,
                                    serverFingerprint: fingerprint,
                                    meta: meta,
                                })
                                    .where((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId));
                            }
                            resolve({
                                ok: true,
                                status: 'verified',
                                fingerprint,
                                remote: meta,
                            });
                            cleanup();
                        }
                        catch (e) {
                            handleError('VERIFY_PARSE_OR_DB_FAILED', e?.message ?? 'Failed to verify');
                        }
                    });
                    stream.stderr?.on('data', (data) => {
                    });
                });
            })
                .on('error', (err) => {
                if (hostKeyMismatch) {
                    handleError('HOST_KEY_CHANGED', 'Remote host key has changed! Security warning.', {
                        storedFingerprint: vps.serverFingerprint,
                        newFingerprint: fingerprint
                    });
                    return;
                }
                let code = 'SSH_CONNECTION_FAILED';
                if (err?.level === 'client-timeout')
                    code = 'SSH_TIMEOUT';
                if (typeof err?.message === 'string' && err.message.toLowerCase().includes('authentication')) {
                    code = 'SSH_AUTH_FAILED';
                }
                handleError(code, err?.message ?? 'SSH connection failed');
            })
                .on('banner', (_msg) => {
            });
            const config = {
                host: vps.host,
                port: port,
                username: vps.username,
                password,
                readyTimeout: timeout,
                hostHash: 'sha256',
                algorithms: {
                    serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'ssh-rsa', 'ssh-dss'],
                },
            };
            config.hostVerifier = (hash) => {
                const safeHash = this.sanitizeText(hash) ?? '';
                let base64Hash = safeHash;
                const looksHex = /^[0-9a-f]+$/i.test(safeHash) && safeHash.length >= 32;
                if (looksHex) {
                    base64Hash = Buffer.from(safeHash, 'hex').toString('base64');
                }
                fingerprint = `SHA256:${base64Hash}`;
                if (updateDb && vps.serverFingerprint && vps.serverFingerprint !== fingerprint) {
                    this.logger.warn(`VPS ${vpsId} host key mismatch! Stored: ${vps.serverFingerprint}, Received: ${fingerprint}`);
                    hostKeyMismatch = true;
                    return false;
                }
                return true;
            };
            try {
                conn.connect(config);
            }
            catch (err) {
                handleError('SSH_CONNECT_ERROR', err?.message ?? 'SSH connect error');
            }
        });
    }
    async createNote(userId, dto) {
        const [note] = await this.drizzle.db
            .insert(schema_1.cockpitNotes)
            .values({
            userId,
            title: dto.title,
            content: dto.content ?? '',
        })
            .returning();
        this.logger.log(`User ${userId} created note ${note.id}`);
        return note;
    }
    async findAllNotes(userId) {
        return this.drizzle.db
            .select()
            .from(schema_1.cockpitNotes)
            .where((0, drizzle_orm_1.eq)(schema_1.cockpitNotes.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.cockpitNotes.updatedAt));
    }
    async findOneNote(userId, noteId) {
        const [note] = await this.drizzle.db
            .select()
            .from(schema_1.cockpitNotes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitNotes.id, noteId), (0, drizzle_orm_1.eq)(schema_1.cockpitNotes.userId, userId)));
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        return note;
    }
    async updateNote(userId, noteId, dto) {
        const updates = {
            updatedAt: new Date(),
        };
        if (dto.title !== undefined)
            updates.title = dto.title;
        if (dto.content !== undefined)
            updates.content = dto.content;
        const [updated] = await this.drizzle.db
            .update(schema_1.cockpitNotes)
            .set(updates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitNotes.id, noteId), (0, drizzle_orm_1.eq)(schema_1.cockpitNotes.userId, userId)))
            .returning();
        if (!updated) {
            throw new common_1.NotFoundException('Note not found');
        }
        this.logger.log(`User ${userId} updated note ${noteId}`);
        return updated;
    }
    async deleteNote(userId, noteId) {
        const [deleted] = await this.drizzle.db
            .delete(schema_1.cockpitNotes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitNotes.id, noteId), (0, drizzle_orm_1.eq)(schema_1.cockpitNotes.userId, userId)))
            .returning();
        if (!deleted) {
            throw new common_1.NotFoundException('Note not found');
        }
        this.logger.log(`User ${userId} deleted note ${noteId}`);
        return { ok: true };
    }
    async getWallpaper(userId) {
        const [user] = await this.drizzle.db
            .select({ wallpaperId: schema_1.users.wallpaperId })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return { wallpaperId: user.wallpaperId ?? 11 };
    }
    async updateWallpaper(userId, wallpaperId) {
        const [updated] = await this.drizzle.db
            .update(schema_1.users)
            .set({ wallpaperId: wallpaperId, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .returning({ wallpaperId: schema_1.users.wallpaperId });
        if (!updated) {
            throw new common_1.NotFoundException('User not found');
        }
        this.logger.log(`User ${userId} updated wallpaper to ${wallpaperId}`);
        return updated;
    }
};
exports.CockpitService = CockpitService;
exports.CockpitService = CockpitService = CockpitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService,
        config_1.ConfigService])
], CockpitService);
//# sourceMappingURL=cockpit.service.js.map