import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import { DrizzleService } from '../../db/drizzle/drizzle.service';
import { CocktailWsHub, AgentSocket, UiSocket } from './cocktail-ws-hub.service';
import { CocktailService } from './cocktail.service';
export declare class CocktailAgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly hub;
    private readonly cocktailService;
    private readonly logger;
    constructor(hub: CocktailWsHub, cocktailService: CocktailService);
    handleConnection(client: AgentSocket, request: IncomingMessage): Promise<void>;
    handleDisconnect(client: AgentSocket): void;
}
export declare class CocktailUiGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly hub;
    private readonly drizzle;
    private readonly logger;
    constructor(hub: CocktailWsHub, drizzle: DrizzleService);
    handleConnection(client: UiSocket, request: IncomingMessage): Promise<void>;
    handleDisconnect(client: UiSocket): void;
}
