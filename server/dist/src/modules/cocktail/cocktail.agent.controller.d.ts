import { CocktailService } from './cocktail.service';
export declare class CocktailAgentController {
    private readonly cocktailService;
    constructor(cocktailService: CocktailService);
    leaseTask(body: {
        deviceId: string;
        token: string;
    }): Promise<{
        id: unknown;
        type: unknown;
        payload: unknown;
        leaseId: unknown;
    } | null>;
    completeTask(body: {
        taskId: string;
        result: any;
        error: any;
        deviceId?: string;
        token?: string;
    }): Promise<{
        success: boolean;
    }>;
    reportMetrics(body: {
        deviceId: string;
        token: string;
        metrics: any;
    }): Promise<void>;
    reportProgress(body: {
        taskId: string;
        progressPct: number;
        logs?: string;
    }): Promise<{
        success: boolean;
    }>;
}
