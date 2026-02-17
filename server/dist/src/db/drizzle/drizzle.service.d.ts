import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
export declare class DrizzleService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private pool;
    private _db;
    constructor(configService: ConfigService);
    get db(): NodePgDatabase<typeof schema>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
