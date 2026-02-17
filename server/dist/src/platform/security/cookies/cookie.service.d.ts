import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
export declare class CookieService {
    private readonly configService;
    private readonly secure;
    private readonly sameSite;
    private readonly sessionTtlSeconds;
    constructor(configService: ConfigService);
    setSessionCookie(res: Response, sessionId: string): void;
    clearSessionCookie(res: Response): void;
    setCsrfCookie(res: Response, token: string): void;
    clearCsrfCookie(res: Response): void;
}
