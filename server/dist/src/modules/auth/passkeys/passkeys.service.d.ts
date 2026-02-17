import { ConfigService } from '@nestjs/config';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { DrizzleService } from '../../../db/drizzle/drizzle.service';
import { Passkey } from '@/db/drizzle/schema';
import { WebauthnService } from './webauthn.service';
export declare class PasskeysService {
    private readonly drizzle;
    private readonly webauthnService;
    private readonly configService;
    private readonly challengeTtlSeconds;
    constructor(drizzle: DrizzleService, webauthnService: WebauthnService, configService: ConfigService);
    startRegistration(userId: string): Promise<PublicKeyCredentialCreationOptionsJSON>;
    finishRegistration(userId: string, data: Record<string, unknown>): Promise<void>;
    startAuthentication(usernameOrEmail: string): Promise<PublicKeyCredentialRequestOptionsJSON>;
    finishAuthentication(usernameOrEmail: string, data: Record<string, unknown>): Promise<string>;
    getUserPasskeys(userId: string): Promise<Passkey[]>;
    deletePasskey(userId: string, passkeyId: string): Promise<void>;
    private cleanupExpiredChallenges;
}
