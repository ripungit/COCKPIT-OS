import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { CockpitTerminalService } from './cockpit-terminal.service';
import { DrizzleService } from '../../../db/drizzle/drizzle.service';
export declare class CockpitTerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly terminalService;
    private readonly drizzle;
    private readonly logger;
    constructor(terminalService: CockpitTerminalService, drizzle: DrizzleService);
    handleConnection(client: WebSocket, request: IncomingMessage): Promise<void>;
    handleDisconnect(client: WebSocket): void;
    private handleSshConnection;
}
