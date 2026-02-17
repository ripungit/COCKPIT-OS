import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../../db/drizzle/drizzle.service';
import { CreateVpsDto } from './dto/create-vps.dto';
import { UpdateVpsDto } from './dto/update-vps.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
export declare class CockpitService {
    private readonly drizzle;
    private readonly configService;
    private readonly logger;
    private readonly algorithm;
    constructor(drizzle: DrizzleService, configService: ConfigService);
    private sanitizeText;
    private sanitizeJson;
    private getEncryptionKey;
    private encryptSecret;
    private decryptSecret;
    createVps(userId: string, dto: CreateVpsDto): Promise<{
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
    findAllVps(userId: string): Promise<{
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
    findOneVps(userId: string, vpsId: string): Promise<{
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
    updateVps(userId: string, vpsId: string, dto: UpdateVpsDto): Promise<{
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
    deleteVps(userId: string, vpsId: string): Promise<{
        ok: boolean;
    }>;
    acceptHostKey(userId: string, vpsId: string, fingerprint: string): Promise<{
        ok: boolean;
    }>;
    verifyVps(userId: string, vpsId: string): Promise<unknown>;
    private testSshConnection;
    createNote(userId: string, dto: CreateNoteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        content: string;
    }>;
    findAllNotes(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        content: string;
    }[]>;
    findOneNote(userId: string, noteId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        content: string;
    }>;
    updateNote(userId: string, noteId: string, dto: UpdateNoteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        content: string;
    }>;
    deleteNote(userId: string, noteId: string): Promise<{
        ok: boolean;
    }>;
    getWallpaper(userId: string): Promise<{
        wallpaperId: number;
    }>;
    updateWallpaper(userId: string, wallpaperId: number): Promise<{
        wallpaperId: number | null;
    }>;
}
