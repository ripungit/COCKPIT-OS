import { CockpitTerminalService } from './cockpit-terminal.service';
import { RequestWithUser } from '../../../platform/http/types/request-context.type';
export declare class CockpitTerminalController {
    private readonly terminalService;
    constructor(terminalService: CockpitTerminalService);
    createSession(req: RequestWithUser, vpsId: string): Promise<{
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
    closeSession(req: RequestWithUser, vpsId: string, sessionId: string): Promise<{
        ok: boolean;
    }>;
}
