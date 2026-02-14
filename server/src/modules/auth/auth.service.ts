import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, or } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { DrizzleService } from '../../db/drizzle/drizzle.service';
import { users, sessions, User } from '@/db/drizzle/schema';
import { ErrorCodes } from '../../common/constants/error-codes';
import { normalizeEmail, normalizeUsername } from '../../common/utils/strings.util';
import { addSeconds } from '../../common/utils/time.util';
import { SignupStartDto } from './dto/signup-start.dto';

@Injectable()
export class AuthService {
    private readonly sessionTtlSeconds: number;

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly configService: ConfigService,
    ) {
        this.sessionTtlSeconds = parseInt(
            this.configService.get<string>('SESSION_TTL_SECONDS', '604800'),
            10,
        );
    }

    async signupStart(dto: SignupStartDto): Promise<{ userId: string }> {
        const db = this.drizzle.db;
        const email = normalizeEmail(dto.email);
        const username = normalizeUsername(dto.username);

        // Check if email or username already exists
        const existing = await db
            .select()
            .from(users)
            .where(or(eq(users.email, email), eq(users.username, username)))
            .limit(1);

        if (existing.length > 0) {
            const existingUser = existing[0];
            if (existingUser.email === email) {
                throw new ConflictException({
                    code: ErrorCodes.EMAIL_EXISTS,
                    message: 'Email already registered',
                });
            }
            throw new ConflictException({
                code: ErrorCodes.USERNAME_EXISTS,
                message: 'Username already taken',
            });
        }

        // Create user without password
        const [newUser] = await db
            .insert(users)
            .values({
                email,
                username,
                firstName: dto.firstName,
                lastName: dto.lastName,
                marketingOptIn: dto.marketingOptIn ?? false,
                role: 'user',
            })
            .returning({ id: users.id });

        return { userId: newUser.id };
    }

    async signupPassword(userId: string, password: string): Promise<void> {
        const db = this.drizzle.db;

        // Hash password
        const passwordHash = await argon2.hash(password);

        // Update user
        const result = await db
            .update(users)
            .set({ passwordHash, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning({ id: users.id });

        if (result.length === 0) {
            throw new NotFoundException({
                code: ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
    }

    async loginPassword(
        usernameOrEmail: string,
        password: string,
    ): Promise<User> {
        const db = this.drizzle.db;
        const normalized = normalizeEmail(usernameOrEmail);

        // Find user by email or username
        const [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.email, normalized), eq(users.username, normalized)))
            .limit(1);

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException({
                code: ErrorCodes.INVALID_CREDENTIALS,
                message: 'Invalid credentials',
            });
        }

        // Verify password
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) {
            throw new UnauthorizedException({
                code: ErrorCodes.INVALID_CREDENTIALS,
                message: 'Invalid credentials',
            });
        }

        return user;
    }

    async createSession(
        userId: string,
        ip?: string,
        userAgent?: string,
    ): Promise<string> {
        const db = this.drizzle.db;
        const sessionId = uuidv4();
        const now = new Date();
        const expiresAt = addSeconds(now, this.sessionTtlSeconds);

        await db.insert(sessions).values({
            id: sessionId,
            userId,
            expiresAt,
            ip,
            userAgent,
        });

        return sessionId;
    }

    async revokeSession(sessionId: string): Promise<void> {
        const db = this.drizzle.db;
        await db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(eq(sessions.id, sessionId));
    }

    async getUserById(userId: string): Promise<User | null> {
        const db = this.drizzle.db;
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        return user || null;
    }

    async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
        const db = this.drizzle.db;
        const normalized = normalizeEmail(usernameOrEmail);
        const [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.email, normalized), eq(users.username, normalized)))
            .limit(1);
        return user || null;
    }
}
