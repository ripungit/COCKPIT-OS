import { DrizzleService } from '../../db/drizzle/drizzle.service';
export declare class CocktailService {
    private readonly drizzle;
    private readonly logger;
    constructor(drizzle: DrizzleService);
    authenticateAgent(deviceId: string, token: string): Promise<boolean>;
    private getMasterKey;
    private encrypt;
    private decrypt;
    startEnrollment(userId: string, vpsId: string): Promise<{
        deviceId: string;
        enrollmentToken: string;
        expiresAt: string;
        installCommand: string;
    }>;
    getDevices(userId: string): Promise<{
        device: {
            status: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            vpsId: string;
            lastSeenAt: Date | null;
            enrolledAt: Date | null;
            disabledAt: Date | null;
            agentVersion: string | null;
            os: string | null;
            arch: string | null;
            hostname: string | null;
            lastIp: string | null;
        };
        vps: {
            name: string;
            id: string;
            username: string;
            host: string;
        } | null;
    }[]>;
    getDevice(userId: string, deviceId: string): Promise<{
        device: {
            status: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            vpsId: string;
            lastSeenAt: Date | null;
            enrolledAt: Date | null;
            disabledAt: Date | null;
            agentVersion: string | null;
            os: string | null;
            arch: string | null;
            hostname: string | null;
            lastIp: string | null;
        };
        vps: {
            status: string;
            name: string;
            id: string;
            username: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            host: string;
            port: number;
            encryptedPassword: string;
            serverFingerprint: string | null;
            lastError: string | null;
            verifiedAt: Date | null;
            meta: unknown;
        } | null;
        metrics: unknown;
    }>;
    disableDevice(userId: string, deviceId: string): Promise<{
        success: boolean;
    }>;
    createTask(userId: string, deviceId: string, type: string, payload: any): Promise<{
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deviceId: string;
        payload: unknown;
        leaseId: string | null;
        leasedAt: Date | null;
        leaseExpiresAt: Date | null;
        attempts: number | null;
        result: unknown;
        error: string | null;
    }>;
    listTasks(userId: string, deviceId: string, limit?: number): Promise<{
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deviceId: string;
        payload: unknown;
        leaseId: string | null;
        leasedAt: Date | null;
        leaseExpiresAt: Date | null;
        attempts: number | null;
        result: unknown;
        error: string | null;
    }[]>;
    getLatestMetrics(userId: string, deviceId: string): Promise<any>;
    getProcessList(userId: string, deviceId: string, options: {
        limit?: number;
        sort?: string;
        descending?: boolean;
    }): Promise<{
        ok: boolean;
        items: any;
        status?: undefined;
        error?: undefined;
        stale?: undefined;
    } | {
        ok: boolean;
        status: string;
        error: any;
        stale: boolean;
        items: {};
    }>;
    killProcess(userId: string, deviceId: string, pid: number, signal: string, force: boolean): Promise<unknown>;
    runBooster(userId: string, deviceId: string, actions: string[], dryRun: boolean): Promise<unknown>;
    finishEnrollment(dto: {
        deviceId: string;
        enrollmentToken: string;
        agentVersion?: string;
        os?: string;
        arch?: string;
        hostname?: string;
    }): Promise<{
        deviceId: string;
        deviceSecret: string;
    }>;
    verifyDeviceAuth(deviceId: string, signature: string, ts: string, nonce: string, rawBody: string): Promise<boolean>;
    updateHeartbeat(deviceId: string, body: any): Promise<{
        status: string;
    }>;
    saveMetrics(deviceId: string, metrics: any): Promise<{
        success: boolean;
        error: any;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    pollTasks(deviceId: string, maxTasks?: number): Promise<{
        leaseId: unknown;
        tasks: {
            id: unknown;
            type: unknown;
            payload: unknown;
        }[];
    }>;
    updateTaskStatus(deviceId: string, taskId: string, body: {
        leaseId: string;
        status: string;
        result: any;
        error: any;
    }): Promise<{
        success: boolean;
    }>;
    executeTaskSync(userId: string, deviceId: string, type: string, payload: any, timeoutMs?: number): Promise<unknown>;
    initTransfer(userId: string, deviceId: string, type: 'upload' | 'download', path: string, sizeBytes?: number): Promise<{
        path: string;
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        deviceId: string;
        error: string | null;
        sizeBytes: number | null;
    }>;
    getTransferForAgent(transferId: string, deviceId: string): Promise<{
        path: string;
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        deviceId: string;
        error: string | null;
        sizeBytes: number | null;
    }>;
    getTransferForUser(transferId: string, userId: string): Promise<{
        path: string;
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        deviceId: string;
        error: string | null;
        sizeBytes: number | null;
    }>;
    getFsListCached(userId: string, deviceId: string, path: string, showHidden?: boolean): Promise<any>;
    private updateFsCache;
    invalidateFsCache(deviceId: string, path: string): Promise<void>;
    updateTaskStatusSimple(taskId: string, result: any, error: any): Promise<void>;
    updateTaskProgress(taskId: string, progressPct: number, logs?: string): Promise<void>;
}
