import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    private readonly s3Client;
    private readonly bucket;
    constructor(configService: ConfigService);
    getPresignedPutUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
    getPresignedGetUrl(key: string, expiresIn?: number): Promise<string>;
    deleteObject(key: string): Promise<void>;
}
