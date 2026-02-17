import { StreamableFile } from '@nestjs/common';
import { CocktailService } from './cocktail.service';
import { StorageService } from './storage.service';
export declare class CocktailTransfersController {
    private readonly cocktailService;
    private readonly storageService;
    constructor(cocktailService: CocktailService, storageService: StorageService);
    initUpload(req: any, body: {
        deviceId: string;
        path: string;
        sizeBytes: number;
    }): Promise<{
        transferId: string;
        uploadUrl: string;
    }>;
    uploadFromBrowser(req: any, transferId: string): Promise<{
        success: boolean;
    }>;
    initDownload(req: any, body: {
        deviceId: string;
        path: string;
    }): Promise<{
        taskId: string;
        downloadUrl: string;
        transferId: string;
        status: string;
    }>;
    downloadToBrowser(req: any, transferId: string): Promise<StreamableFile>;
    agentUpload(req: any, transferId: string): Promise<unknown>;
    agentDownload(req: any, transferId: string): Promise<StreamableFile>;
}
