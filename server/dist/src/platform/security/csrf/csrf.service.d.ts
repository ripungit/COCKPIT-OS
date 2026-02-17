import { Response } from 'express';
import { CookieService } from '../cookies/cookie.service';
export declare class CsrfService {
    private readonly cookieService;
    constructor(cookieService: CookieService);
    generateToken(): string;
    rotateCsrfToken(res: Response): string;
    validateToken(cookieToken: string | undefined, headerToken: string | undefined): boolean;
}
