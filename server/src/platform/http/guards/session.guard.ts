import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { DrizzleService } from '../../../db/drizzle/drizzle.service';
import { sessions, users } from '@/db/drizzle/schema';
import { COOKIE_NAMES } from '../../security/cookies/cookie.constants';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { RequestWithUser } from '../types/request-context.type';

@Injectable()
export class SessionGuard implements CanActivate {
    constructor(private readonly drizzle: DrizzleService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const sessionId = request.cookies?.[COOKIE_NAMES.SESSION];

        console.log('[SessionGuard] Cookies:', request.cookies);
        console.log('[SessionGuard] Session ID:', sessionId);

        if (!sessionId) {
            throw new UnauthorizedException({
                code: ErrorCodes.SESSION_REQUIRED,
                message: 'Session required',
            });
        }

        const now = new Date();
        const db = this.drizzle.db;

        // Find valid session
        const [session] = await db
            .select()
            .from(sessions)
            .where(
                and(
                    eq(sessions.id, sessionId),
                    isNull(sessions.revokedAt),
                    gt(sessions.expiresAt, now),
                ),
            )
            .limit(1);

        if (!session) {
            throw new UnauthorizedException({
                code: ErrorCodes.SESSION_INVALID,
                message: 'Invalid or expired session',
            });
        }

        // Get user
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);

        if (!user) {
            throw new UnauthorizedException({
                code: ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }

        // Attach user to request
        request.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            marketingOptIn: user.marketingOptIn,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        request.sessionId = session.id;

        return true;
    }
}
