import { CocktailService } from './cocktail.service';
export declare class CocktailFsController {
    private readonly cocktailService;
    constructor(cocktailService: CocktailService);
    list(req: any, deviceId: string, body: {
        path: string;
        showHidden?: boolean;
    }): Promise<{
        items: any;
    }>;
    listGet(req: any, deviceId: string, path: string): Promise<unknown>;
    stat(req: any, deviceId: string, body: {
        path: string;
    }): Promise<unknown>;
    readText(req: any, deviceId: string, body: {
        path: string;
        maxBytes?: number;
    }): Promise<unknown>;
    writeText(req: any, deviceId: string, body: {
        path: string;
        content: string;
        mode?: string;
    }): Promise<unknown>;
    mkdir(req: any, deviceId: string, body: {
        path: string;
        recursive?: boolean;
    }): Promise<unknown>;
    delete(req: any, deviceId: string, body: {
        path: string;
        recursive?: boolean;
    }): Promise<unknown>;
    move(req: any, deviceId: string, body: {
        from: string;
        to: string;
    }): Promise<unknown>;
    search(req: any, deviceId: string, body: {
        root: string;
        query: string;
        maxResults?: number;
    }): Promise<unknown>;
}
