import { ConfigService } from '@nestjs/config';
import { DrizzleService } from 'src/db/drizzle/drizzle.service';
export declare class TokenService {
    private configService;
    private drizzleService;
    constructor(configService: ConfigService, drizzleService: DrizzleService);
    hashToken(token: string): Promise<string>;
    findUserByToken(token: string): Promise<any | null>;
    findNodeByAgentKey(agentName: string, agentKey: string): Promise<any | null>;
}
