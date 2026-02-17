import { WebSocket } from 'ws';
export type AgentSocket = WebSocket & {
    deviceId?: string;
    isAlive?: boolean;
};
export type UiSocket = WebSocket & {
    deviceId?: string;
    isAlive?: boolean;
    topics?: Set<string>;
};
export declare class CocktailWsHub {
    private readonly logger;
    private agents;
    private uiByDevice;
    private lastKnownData;
    constructor();
    private heartbeat;
    registerAgent(deviceId: string, ws: AgentSocket): void;
    removeAgent(ws: AgentSocket): void;
    registerUi(deviceId: string, ws: UiSocket): void;
    removeUi(ws: UiSocket): void;
    broadcastToUi(deviceId: string, msg: any): void;
    sendInitialCache(deviceId: string, ws: UiSocket): void;
    sendToAgent(deviceId: string, msg: any): boolean;
}
