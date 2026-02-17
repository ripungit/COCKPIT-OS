import { ConfigService } from '@nestjs/config';
import { VerifiedRegistrationResponse, VerifiedAuthenticationResponse } from '@simplewebauthn/server';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON, AuthenticationResponseJSON, AuthenticatorDevice } from '@simplewebauthn/types';
import { Passkey } from '@/db/drizzle/schema';
export declare class WebauthnService {
    private readonly configService;
    private readonly rpName;
    private readonly rpId;
    private readonly rpOrigin;
    constructor(configService: ConfigService);
    generateRegistrationOptions(userId: string, userName: string, userDisplayName: string, existingPasskeys: Passkey[]): Promise<PublicKeyCredentialCreationOptionsJSON>;
    verifyRegistration(response: RegistrationResponseJSON, expectedChallenge: string): Promise<VerifiedRegistrationResponse>;
    generateAuthenticationOptions(passkeys: Passkey[]): Promise<PublicKeyCredentialRequestOptionsJSON>;
    verifyAuthentication(response: AuthenticationResponseJSON, expectedChallenge: string, authenticator: AuthenticatorDevice): Promise<VerifiedAuthenticationResponse>;
    base64urlToUint8Array(base64url: string): Uint8Array;
    uint8ArrayToBase64url(buffer: Uint8Array): string;
}
