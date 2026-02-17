import { CocktailService } from './cocktail.service';
import { StorageService } from './storage.service';
import { DrizzleService } from '../../db/drizzle/drizzle.service';
export declare class CocktailUploadsController {
    private readonly cocktailService;
    private readonly storageService;
    private readonly drizzle;
    constructor(cocktailService: CocktailService, storageService: StorageService, drizzle: DrizzleService);
    initUpload(userId: string, vpsId: string, body: {
        filename: string;
        sizeBytes: number;
        mimeType?: string;
        destPath: string;
    }): Promise<{
        uploadId: string;
        objectKey: string;
        putUrl: string;
        expiresAt: Date;
    }>;
    completeUpload(userId: string, vpsId: string, uploadId: string, body: {
        sha256?: string;
        mode?: string;
    }): Promise<{
        taskId: string;
    }>;
    getStatus(userId: string, uploadId: string): Promise<{
        upload: {
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            vpsId: string;
            deviceId: string;
            sizeBytes: number;
            objectKey: string;
            filename: string;
            mimeType: string | null;
            destPath: string;
            sha256: string | null;
            taskId: string | null;
        };
        task: {
            type: string;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deviceId: string;
            payload: unknown;
            leaseId: string | null;
            leasedAt: Date | null;
            leaseExpiresAt: Date | null;
            attempts: number | null;
            result: unknown;
            error: string | null;
        } | null;
    }>;
}
