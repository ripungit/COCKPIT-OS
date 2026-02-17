export declare class SystemBoosterController {
    boostSystem(): Promise<{
        success: boolean;
        freedMB: number;
        platform: NodeJS.Platform;
    }>;
}
