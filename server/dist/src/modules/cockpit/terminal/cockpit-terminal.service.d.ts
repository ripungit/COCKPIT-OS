import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../../../db/drizzle/drizzle.service';
export declare class CockpitTerminalService {
    private readonly drizzle;
    private readonly configService;
    private readonly logger;
    private readonly algorithm;
    constructor(drizzle: DrizzleService, configService: ConfigService);
    private getEncryptionKey;
    private decryptSecret;
    createSession(userId: string, vpsId: string): Promise<{
        sessionId: string;
        wsUrl: string;
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
        };
    }>;
    getVpsCredentials(sessionId: string, userId: string): Promise<{
        password: string;
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
    } | null>;
    markConnected(sessionId: string): Promise<void>;
    markClosed(sessionId: string): Promise<void>;
}
