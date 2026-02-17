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
var CocktailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CocktailService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_service_1 = require("../../db/drizzle/drizzle.service");
const schema_1 = require("../../db/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto = __importStar(require("crypto"));
const argon2 = __importStar(require("argon2"));
const date_fns_1 = require("date-fns");
let CocktailService = CocktailService_1 = class CocktailService {
    constructor(drizzle) {
        this.drizzle = drizzle;
        this.logger = new common_1.Logger(CocktailService_1.name);
    }
    async authenticateAgent(deviceId, token) {
        const db = this.drizzle.db;
        const [device] = await db
            .select()
            .from(schema_1.cocktailDevices)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId))
            .limit(1);
        if (!device)
            return false;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const [tokenRow] = await db
            .select()
            .from(schema_1.cocktailEnrollmentTokens)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailEnrollmentTokens.deviceId, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailEnrollmentTokens.tokenHash, tokenHash), (0, drizzle_orm_1.gt)(schema_1.cocktailEnrollmentTokens.expiresAt, new Date())))
            .limit(1);
        if (tokenRow)
            return true;
        const [secret] = await db
            .select()
            .from(schema_1.cocktailDeviceSecrets)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailDeviceSecrets.deviceId, deviceId))
            .limit(1);
        if (!secret)
            return false;
        return argon2.verify(secret.secretHash, token);
    }
    getMasterKey() {
        const key = process.env.COCKTAIL_MASTER_KEY || 'default-insecure-master-key-32-bytes!!';
        return crypto.createHash('sha256').update(key).digest();
    }
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const key = this.getMasterKey();
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }
    decrypt(text) {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = this.getMasterKey();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    async startEnrollment(userId, vpsId) {
        const db = this.drizzle.db;
        const [vps] = await db
            .select()
            .from(schema_1.cockpitVps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cockpitVps.id, vpsId), (0, drizzle_orm_1.eq)(schema_1.cockpitVps.userId, userId)))
            .limit(1);
        if (!vps) {
            throw new common_1.NotFoundException('VPS not found');
        }
        if (vps.status !== 'verified' && vps.status !== 'agent_installed') {
            if (vps.status !== 'verified' && vps.status !== 'agent_installed') {
                throw new common_1.BadRequestException(`VPS must be verified (current status: ${vps.status})`);
            }
        }
        let [device] = await db
            .select()
            .from(schema_1.cocktailDevices)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.vpsId, vpsId))
            .limit(1);
        if (!device) {
            [device] = await db
                .insert(schema_1.cocktailDevices)
                .values({
                userId,
                vpsId,
                name: vps.name,
                status: 'enrolling',
            })
                .returning();
        }
        else {
            await db
                .update(schema_1.cocktailDevices)
                .set({ status: 'enrolling', disabledAt: null })
                .where((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, device.id));
        }
        const tokenRaw = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
        await db.insert(schema_1.cocktailEnrollmentTokens).values({
            tokenHash,
            deviceId: device.id,
            expiresAt: (0, date_fns_1.addMinutes)(new Date(), 10),
        });
        const serverUrl = process.env.API_PUBLIC_URL || 'https://wholeheartedly-forgiving-sharron.ngrok-free.dev';
        return {
            deviceId: device.id,
            enrollmentToken: tokenRaw,
            expiresAt: (0, date_fns_1.addMinutes)(new Date(), 10).toISOString(),
            installCommand: `curl -kfsSL ${serverUrl}/cocktail/install.sh | sudo bash -s -- --serverUrl ${serverUrl} --token ${tokenRaw} --deviceId ${device.id} && sudo apt-get update && sudo apt-get install -y neofetch && sudo npm install -g ws`
        };
    }
    async getDevices(userId) {
        const db = this.drizzle.db;
        return db
            .select({
            device: schema_1.cocktailDevices,
            vps: {
                id: schema_1.cockpitVps.id,
                name: schema_1.cockpitVps.name,
                host: schema_1.cockpitVps.host,
                username: schema_1.cockpitVps.username,
            }
        })
            .from(schema_1.cocktailDevices)
            .leftJoin(schema_1.cockpitVps, (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.vpsId, schema_1.cockpitVps.id))
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId));
    }
    async getDevice(userId, deviceId) {
        const db = this.drizzle.db;
        const [result] = await db
            .select({
            device: schema_1.cocktailDevices,
            vps: schema_1.cockpitVps,
            metrics: schema_1.cocktailMetricsLatest.metrics
        })
            .from(schema_1.cocktailDevices)
            .leftJoin(schema_1.cockpitVps, (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.vpsId, schema_1.cockpitVps.id))
            .leftJoin(schema_1.cocktailMetricsLatest, (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, schema_1.cocktailMetricsLatest.deviceId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId)))
            .limit(1);
        if (!result)
            throw new common_1.NotFoundException('Device not found');
        return result;
    }
    async disableDevice(userId, deviceId) {
        const db = this.drizzle.db;
        const [device] = await db.select().from(schema_1.cocktailDevices).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId))).limit(1);
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        await db
            .update(schema_1.cocktailDevices)
            .set({
            status: 'disabled',
            disabledAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId));
        return { success: true };
    }
    async createTask(userId, deviceId, type, payload) {
        const db = this.drizzle.db;
        const [device] = await db.select().from(schema_1.cocktailDevices).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId))).limit(1);
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        const [task] = await db
            .insert(schema_1.cocktailTasks)
            .values({
            deviceId,
            type,
            payload,
            status: 'queued',
        })
            .returning();
        return task;
    }
    async listTasks(userId, deviceId, limit = 50) {
        const db = this.drizzle.db;
        const [device] = await db.select().from(schema_1.cocktailDevices).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId))).limit(1);
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        return db
            .select()
            .from(schema_1.cocktailTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTasks.deviceId, deviceId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.cocktailTasks.createdAt))
            .limit(limit);
    }
    async getLatestMetrics(userId, deviceId) {
        const db = this.drizzle.db;
        const [device] = await db.select().from(schema_1.cocktailDevices).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId))).limit(1);
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        const [metricsRecord] = await db
            .select()
            .from(schema_1.cocktailMetricsLatest)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailMetricsLatest.deviceId, deviceId))
            .limit(1);
        const online = device.lastSeenAt ? (Date.now() - new Date(device.lastSeenAt).getTime() <= 35000) : false;
        return {
            deviceId,
            online,
            lastSeenAt: device.lastSeenAt,
            metricsAt: metricsRecord?.updatedAt,
            ...metricsRecord?.metrics
        };
    }
    async getProcessList(userId, deviceId, options) {
        try {
            const result = (await this.executeTaskSync(userId, deviceId, 'proc.list', options, 15000));
            if (result && result.items) {
                await this.drizzle.db
                    .insert(schema_1.cocktailProcessesLatest)
                    .values({
                    deviceId,
                    items: result.items,
                    capturedAt: new Date(),
                    updatedAt: new Date(),
                })
                    .onConflictDoUpdate({
                    target: schema_1.cocktailProcessesLatest.deviceId,
                    set: { items: result.items, capturedAt: new Date(), updatedAt: new Date() }
                });
                return { ok: true, items: result.items };
            }
            return { ok: false, items: [] };
        }
        catch (e) {
            const [snap] = await this.drizzle.db
                .select()
                .from(schema_1.cocktailProcessesLatest)
                .where((0, drizzle_orm_1.eq)(schema_1.cocktailProcessesLatest.deviceId, deviceId))
                .limit(1);
            return {
                ok: false,
                status: 'error',
                error: e.message || 'Timed out waiting for agent',
                stale: !!snap,
                items: snap?.items || []
            };
        }
    }
    async killProcess(userId, deviceId, pid, signal, force) {
        if (pid === 1 && !force)
            throw new common_1.BadRequestException('Cannot kill PID 1 by default');
        return this.executeTaskSync(userId, deviceId, 'proc.kill', { pid, signal, force }, 10000);
    }
    async runBooster(userId, deviceId, actions, dryRun) {
        return this.executeTaskSync(userId, deviceId, 'boost.run', { actions, dryRun }, 15000);
    }
    async finishEnrollment(dto) {
        const db = this.drizzle.db;
        const { deviceId, enrollmentToken } = dto;
        const tokenHash = crypto.createHash('sha256').update(enrollmentToken).digest('hex');
        const [validToken] = await db
            .select()
            .from(schema_1.cocktailEnrollmentTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailEnrollmentTokens.tokenHash, tokenHash))
            .limit(1);
        if (!validToken)
            throw new common_1.UnauthorizedException('Invalid token');
        if (validToken.deviceId !== deviceId)
            throw new common_1.UnauthorizedException('Token mismatch');
        await db
            .update(schema_1.cocktailEnrollmentTokens)
            .set({ usedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailEnrollmentTokens.tokenHash, tokenHash));
        const secretRaw = crypto.randomBytes(32).toString('hex');
        const secretHash = await argon2.hash(secretRaw);
        const encryptedSecret = this.encrypt(secretRaw);
        await db
            .insert(schema_1.cocktailDeviceSecrets)
            .values({
            deviceId,
            secretHash,
            encryptedSecret,
            isActive: true,
            secretCreatedAt: new Date()
        })
            .onConflictDoUpdate({
            target: schema_1.cocktailDeviceSecrets.deviceId,
            set: {
                secretHash,
                encryptedSecret,
                isActive: true,
                secretLastUsedAt: null,
                secretCreatedAt: new Date()
            }
        });
        await db
            .update(schema_1.cocktailDevices)
            .set({
            status: 'online',
            enrolledAt: new Date(),
            lastSeenAt: new Date(),
            agentVersion: dto.agentVersion,
            os: dto.os,
            arch: dto.arch,
            hostname: dto.hostname,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId));
        return { deviceId, deviceSecret: secretRaw };
    }
    async verifyDeviceAuth(deviceId, signature, ts, nonce, rawBody) {
        const now = Math.floor(Date.now() / 1000);
        const timestamp = parseInt(ts, 10);
        if (Math.abs(now - timestamp) > 60) {
            return false;
        }
        const db = this.drizzle.db;
        const [secretRec] = await db
            .select()
            .from(schema_1.cocktailDeviceSecrets)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDeviceSecrets.deviceId, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDeviceSecrets.isActive, true)))
            .limit(1);
        if (!secretRec)
            return false;
        let secret = '';
        if (secretRec.encryptedSecret) {
            try {
                secret = this.decrypt(secretRec.encryptedSecret);
            }
            catch (e) {
                console.error('Failed to decrypt secret', e);
                return false;
            }
        }
        else {
            console.error('No encrypted secret available for HMAC verification');
            return false;
        }
        let bodyHash = '';
        if (rawBody && rawBody !== '{}') {
            bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
        }
        else {
            bodyHash = crypto.createHash('sha256').update('').digest('hex');
            if (rawBody === '{}') {
                bodyHash = crypto.createHash('sha256').update('{}').digest('hex');
            }
        }
        const payloadToSign = `${ts}.${nonce}.${bodyHash}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payloadToSign)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expectedSignature || ''));
    }
    async updateHeartbeat(deviceId, body) {
        const db = this.drizzle.db;
        await db
            .update(schema_1.cocktailDevices)
            .set({
            lastSeenAt: new Date(),
            status: 'online',
            agentVersion: body.agentVersion
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId));
        await db
            .update(schema_1.cocktailDeviceSecrets)
            .set({ secretLastUsedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDeviceSecrets.deviceId, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDeviceSecrets.isActive, true)));
        return { status: 'ok' };
    }
    async saveMetrics(deviceId, metrics) {
        const db = this.drizzle.db;
        try {
            await db.transaction(async (tx) => {
                await tx
                    .insert(schema_1.cocktailMetricsLatest)
                    .values({
                    deviceId,
                    metrics,
                    updatedAt: new Date()
                })
                    .onConflictDoUpdate({
                    target: schema_1.cocktailMetricsLatest.deviceId,
                    set: { metrics, updatedAt: new Date() }
                });
            });
        }
        catch (error) {
            this.logger.error(`[CocktailService] Failed to save metrics for ${deviceId}: ${error.message}`, error.stack);
            return { success: false, error: error.message };
        }
        return { success: true };
    }
    async pollTasks(deviceId, maxTasks = 5) {
        const db = this.drizzle.db;
        return await db.transaction(async (tx) => {
            const updatedTasks = await tx.execute((0, drizzle_orm_1.sql) `
                UPDATE cocktail_tasks 
                SET status = 'leased', 
                    lease_id = ${crypto.randomBytes(16).toString('hex')}, 
                    leased_at = NOW(), 
                    lease_expires_at = NOW() + INTERVAL '60 seconds'
                WHERE id IN (
                    SELECT id FROM cocktail_tasks 
                    WHERE device_id = ${deviceId} AND (status = 'queued' OR status = 'pending')
                    ORDER BY created_at ASC
                    LIMIT ${maxTasks}
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id, type, payload, lease_id as "leaseId"
             `);
            if (updatedTasks.rows.length === 0)
                return { leaseId: null, tasks: [] };
            const leaseId = updatedTasks.rows[0].leaseId;
            return {
                leaseId,
                tasks: updatedTasks.rows.map(row => ({
                    id: row.id,
                    type: row.type,
                    payload: row.payload
                }))
            };
        });
    }
    async updateTaskStatus(deviceId, taskId, body) {
        const db = this.drizzle.db;
        const { leaseId, status, result, error } = body;
        const [task] = await db
            .select()
            .from(schema_1.cocktailTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTasks.id, taskId))
            .limit(1);
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.leaseId !== leaseId)
            throw new common_1.UnauthorizedException('Invalid lease');
        if (task.deviceId !== deviceId)
            throw new common_1.UnauthorizedException('Wrong device');
        await db
            .update(schema_1.cocktailTasks)
            .set({
            status: status,
            result,
            error,
            updatedAt: new Date(),
            leaseId: (status === 'succeeded' || status === 'failed') ? null : leaseId
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTasks.id, taskId));
        return { success: true };
    }
    async executeTaskSync(userId, deviceId, type, payload, timeoutMs = 15000) {
        const task = await this.createTask(userId, deviceId, type, payload);
        const startTime = Date.now();
        const pollInterval = 200;
        while (Date.now() - startTime < timeoutMs) {
            const [currentTask] = await this.drizzle.db
                .select()
                .from(schema_1.cocktailTasks)
                .where((0, drizzle_orm_1.eq)(schema_1.cocktailTasks.id, task.id))
                .limit(1);
            if (currentTask.status === 'succeeded') {
                return currentTask.result;
            }
            if (currentTask.status === 'failed') {
                throw new common_1.BadRequestException(`Task failed: ${currentTask.error || 'Unknown error'}`);
            }
            await new Promise(r => setTimeout(r, pollInterval));
        }
        console.warn(`[CocktailService] Task ${task.id} (${type}) timed out after ${timeoutMs}ms waiting for agent ${deviceId}`);
        throw new common_1.BadRequestException('Task timed out waiting for agent response');
    }
    async initTransfer(userId, deviceId, type, path, sizeBytes) {
        const db = this.drizzle.db;
        const [device] = await db.select().from(schema_1.cocktailDevices).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailDevices.id, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailDevices.userId, userId))).limit(1);
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        const [transfer] = await db
            .insert(schema_1.cocktailTransfers)
            .values({
            userId,
            deviceId,
            type,
            path,
            sizeBytes,
            expiresAt: (0, date_fns_1.addMinutes)(new Date(), 60),
        })
            .returning();
        return transfer;
    }
    async getTransferForAgent(transferId, deviceId) {
        const db = this.drizzle.db;
        const [transfer] = await db
            .select()
            .from(schema_1.cocktailTransfers)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTransfers.id, transferId))
            .limit(1);
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.deviceId !== deviceId)
            throw new common_1.UnauthorizedException('Wrong device');
        return transfer;
    }
    async getTransferForUser(transferId, userId) {
        const db = this.drizzle.db;
        const [transfer] = await db
            .select()
            .from(schema_1.cocktailTransfers)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTransfers.id, transferId))
            .limit(1);
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.userId !== userId)
            throw new common_1.UnauthorizedException('Wrong user');
        return transfer;
    }
    async getFsListCached(userId, deviceId, path, showHidden = false) {
        const db = this.drizzle.db;
        const [cache] = await db
            .select()
            .from(schema_1.cocktailFsCache)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailFsCache.deviceId, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailFsCache.path, path)))
            .limit(1);
        const isFresh = cache && (Date.now() - new Date(cache.updatedAt).getTime() < 1000 * 60 * 5);
        if (isFresh) {
            this.executeTaskSync(userId, deviceId, 'fs.list', { path, showHidden }).then(result => {
                if (result && result.items) {
                    this.updateFsCache(deviceId, path, result.items);
                }
            }).catch(() => { });
            return cache.items;
        }
        const result = (await this.executeTaskSync(userId, deviceId, 'fs.list', { path, showHidden }));
        if (result && result.items) {
            await this.updateFsCache(deviceId, path, result.items);
            return result.items;
        }
        return [];
    }
    async updateFsCache(deviceId, path, items) {
        const db = this.drizzle.db;
        await db
            .insert(schema_1.cocktailFsCache)
            .values({ deviceId, path, items, updatedAt: new Date() })
            .onConflictDoUpdate({
            target: [schema_1.cocktailFsCache.deviceId, schema_1.cocktailFsCache.path],
            set: { items, updatedAt: new Date() }
        });
    }
    async invalidateFsCache(deviceId, path) {
        const db = this.drizzle.db;
        await db.delete(schema_1.cocktailFsCache)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailFsCache.deviceId, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailFsCache.path, path)));
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        if (parentPath !== path) {
            await db.delete(schema_1.cocktailFsCache)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cocktailFsCache.deviceId, deviceId), (0, drizzle_orm_1.eq)(schema_1.cocktailFsCache.path, parentPath)));
        }
    }
    async updateTaskStatusSimple(taskId, result, error) {
        const db = this.drizzle.db;
        const [task] = await db
            .select()
            .from(schema_1.cocktailTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTasks.id, taskId))
            .limit(1);
        if (!task)
            return;
        await db
            .update(schema_1.cocktailTasks)
            .set({
            status: error ? 'failed' : 'succeeded',
            result,
            error,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTasks.id, taskId));
    }
    async updateTaskProgress(taskId, progressPct, logs) {
        const db = this.drizzle.db;
        await db
            .update(schema_1.cocktailTasks)
            .set({
            status: 'running',
            updatedAt: new Date(),
            result: { progressPct, logs }
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cocktailTasks.id, taskId));
    }
};
exports.CocktailService = CocktailService;
exports.CocktailService = CocktailService = CocktailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])
], CocktailService);
//# sourceMappingURL=cocktail.service.js.map