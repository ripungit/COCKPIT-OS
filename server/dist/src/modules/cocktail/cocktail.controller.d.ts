import { CocktailService } from './cocktail.service';
export declare class CocktailController {
    private readonly cocktailService;
    constructor(cocktailService: CocktailService);
    startEnrollment(req: any, body: {
        vpsId: string;
    }): Promise<{
        deviceId: string;
        enrollmentToken: string;
        expiresAt: string;
        installCommand: string;
    }>;
    getDevices(req: any): Promise<{
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
    getDevice(req: any, deviceId: string): Promise<{
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
    disableDevice(req: any, deviceId: string): Promise<{
        success: boolean;
    }>;
    createTask(req: any, deviceId: string, body: {
        type: string;
        payload: any;
    }): Promise<{
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
    listTasks(req: any, deviceId: string, limit: number): Promise<{
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
    getLatestMetrics(req: any, deviceId: string): Promise<any>;
    getProcessList(req: any, deviceId: string, body: {
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
    killProcess(req: any, deviceId: string, body: {
        pid: number;
        signal?: string;
        force?: boolean;
    }): Promise<unknown>;
    runBooster(req: any, deviceId: string, body: {
        actions: string[];
        dryRun?: boolean;
    }): Promise<unknown>;
}
