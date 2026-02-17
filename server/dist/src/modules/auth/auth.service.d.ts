import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../../db/drizzle/drizzle.service';
import { User } from '@/db/drizzle/schema';
import { SignupStartDto } from './dto/signup-start.dto';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private readonly drizzle;
    private readonly configService;
    private readonly mailService;
    private readonly sessionTtlSeconds;
    constructor(drizzle: DrizzleService, configService: ConfigService, mailService: MailService);
    private generateOtp;
    signupStart(dto: SignupStartDto): Promise<{
        userId: string;
    }>;
    signupVerify(userId: string, otp: string): Promise<void>;
    signupPassword(userId: string, password: string): Promise<void>;
    loginPassword(usernameOrEmail: string, password: string): Promise<User>;
    createSession(userId: string, ip?: string, userAgent?: string): Promise<string>;
    revokeSession(sessionId: string): Promise<void>;
    getUserById(userId: string): Promise<User | null>;
    getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | null>;
}
