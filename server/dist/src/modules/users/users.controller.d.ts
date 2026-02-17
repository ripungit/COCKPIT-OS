import { UsersService } from './users.service';
import { PasskeysService } from '../auth/passkeys/passkeys.service';
import { RequestUser } from '../../platform/http/types/request-context.type';
import { UpdateMeDto } from './dto/update-me.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly passkeysService;
    constructor(usersService: UsersService, passkeysService: PasskeysService);
    getMe(user: RequestUser): {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        role: string;
        marketingOptIn: boolean;
        wallpaperId: number;
        createdAt: Date;
        updatedAt: Date;
    };
    updateMe(userId: string, dto: UpdateMeDto): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        role: string;
        marketingOptIn: boolean;
        wallpaperId: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPasskeys(userId: string): Promise<{
        id: string;
        deviceType: string | null;
        backedUp: boolean;
        createdAt: Date;
    }[]>;
    startPasskeyRegistration(userId: string): Promise<import("@simplewebauthn/types").PublicKeyCredentialCreationOptionsJSON>;
    finishPasskeyRegistration(userId: string, body: {
        data: Record<string, unknown>;
    }): Promise<{
        ok: boolean;
    }>;
    deletePasskey(userId: string, passkeyId: string): Promise<{
        ok: boolean;
    }>;
}
