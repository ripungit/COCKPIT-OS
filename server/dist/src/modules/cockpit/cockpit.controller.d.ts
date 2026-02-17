import { CockpitService } from './cockpit.service';
import { CreateVpsDto } from './dto/create-vps.dto';
import { UpdateVpsDto } from './dto/update-vps.dto';
import { AcceptHostKeyDto } from './dto/accept-host-key.dto';
export declare class CockpitController {
    private readonly cockpitService;
    constructor(cockpitService: CockpitService);
    create(userId: string, dto: CreateVpsDto): Promise<{
        status: string;
        name: string;
        id: string;
        username: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        host: string;
        port: number;
        serverFingerprint: string | null;
        lastError: string | null;
        verifiedAt: Date | null;
        meta: unknown;
    }>;
    findAll(userId: string): Promise<{
        status: string;
        name: string;
        id: string;
        username: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        host: string;
        port: number;
        serverFingerprint: string | null;
        lastError: string | null;
        verifiedAt: Date | null;
        meta: unknown;
    }[]>;
    findOne(userId: string, vpsId: string): Promise<{
        status: string;
        name: string;
        id: string;
        username: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        host: string;
        port: number;
        serverFingerprint: string | null;
        lastError: string | null;
        verifiedAt: Date | null;
        meta: unknown;
    }>;
    update(userId: string, vpsId: string, dto: UpdateVpsDto): Promise<{
        status: string;
        name: string;
        id: string;
        username: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        host: string;
        port: number;
        serverFingerprint: string | null;
        lastError: string | null;
        verifiedAt: Date | null;
        meta: unknown;
    }>;
    delete(userId: string, vpsId: string): Promise<{
        ok: boolean;
    }>;
    verify(userId: string, vpsId: string): Promise<unknown>;
    acceptHostKey(userId: string, vpsId: string, body: AcceptHostKeyDto): Promise<{
        ok: boolean;
    }>;
}
