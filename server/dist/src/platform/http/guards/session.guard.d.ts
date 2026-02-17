import { CanActivate, ExecutionContext } from '@nestjs/common';
import { DrizzleService } from '../../../db/drizzle/drizzle.service';
export declare class SessionGuard implements CanActivate {
    private readonly drizzle;
    constructor(drizzle: DrizzleService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
