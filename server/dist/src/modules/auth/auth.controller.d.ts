import { Response } from 'express';
import { AuthService } from './auth.service';
import { PasskeysService } from './passkeys/passkeys.service';
import { CsrfService } from '../../platform/security/csrf/csrf.service';
import { CookieService } from '../../platform/security/cookies/cookie.service';
import { RequestWithUser, RequestUser } from '../../platform/http/types/request-context.type';
import { SignupStartDto } from './dto/signup-start.dto';
import { SignupVerifyDto } from './dto/signup-verify.dto';
import { SignupPasswordDto } from './dto/signup-password.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { PasskeyStartDto } from './dto/passkey-start.dto';
import { PasskeyFinishDto } from './dto/passkey-finish.dto';
export declare class AuthController {
    private readonly authService;
    private readonly passkeysService;
    private readonly csrfService;
    private readonly cookieService;
    constructor(authService: AuthService, passkeysService: PasskeysService, csrfService: CsrfService, cookieService: CookieService);
    getCsrf(res: Response): {
        ok: boolean;
    };
    signupStart(dto: SignupStartDto): Promise<{
        userId: string;
    }>;
    signupVerify(dto: SignupVerifyDto): Promise<{
        ok: boolean;
    }>;
    signupPassword(dto: SignupPasswordDto, req: RequestWithUser, res: Response): Promise<{
        ok: boolean;
    }>;
    loginPassword(dto: LoginPasswordDto, req: RequestWithUser, res: Response): Promise<{
        ok: boolean;
    }>;
    logout(req: RequestWithUser, res: Response): Promise<{
        ok: boolean;
    }>;
    getMe(user: RequestUser): {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        role: string;
        marketingOptIn: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    signupPasskeyStart(dto: PasskeyStartDto): Promise<import("@simplewebauthn/types").PublicKeyCredentialCreationOptionsJSON>;
    signupPasskeyFinish(dto: PasskeyFinishDto, req: RequestWithUser, res: Response): Promise<{
        ok: boolean;
    }>;
    loginPasskeyStart(dto: PasskeyStartDto): Promise<import("@simplewebauthn/types").PublicKeyCredentialRequestOptionsJSON>;
    loginPasskeyFinish(dto: PasskeyFinishDto, req: RequestWithUser, res: Response): Promise<{
        ok: boolean;
    }>;
    devLogin(userId: string, req: RequestWithUser, res: Response): Promise<{
        ok: boolean;
        sessionId: string;
    }>;
}
