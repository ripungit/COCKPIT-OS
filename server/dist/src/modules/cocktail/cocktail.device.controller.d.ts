import { CocktailService } from './cocktail.service';
export declare class CocktailDeviceController {
    private readonly cocktailService;
    constructor(cocktailService: CocktailService);
    finishEnrollment(body: any): Promise<{
        deviceId: string;
        deviceSecret: string;
    }>;
    heartbeat(req: any, body: any): Promise<{
        status: string;
    }>;
    metrics(req: any, body: any): Promise<{
        success: boolean;
        error: any;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    pollTasks(req: any, body: {
        maxTasks?: number;
    }): Promise<{
        leaseId: unknown;
        tasks: {
            id: unknown;
            type: unknown;
            payload: unknown;
        }[];
    }>;
    updateTaskStatus(req: any, taskId: string, body: any): Promise<{
        success: boolean;
    }>;
}
