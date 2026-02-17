import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TokenService } from '../services/token.service';
export declare class BearerAuthGuard implements CanActivate {
    private tokenService;
    constructor(tokenService: TokenService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
