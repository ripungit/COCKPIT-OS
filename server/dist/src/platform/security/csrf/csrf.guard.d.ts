import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfService } from './csrf.service';
export declare const CSRF_EXEMPT_KEY = "csrf_exempt";
export declare class CsrfGuard implements CanActivate {
    private readonly csrfService;
    private readonly reflector;
    private readonly mutatingMethods;
    constructor(csrfService: CsrfService, reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
