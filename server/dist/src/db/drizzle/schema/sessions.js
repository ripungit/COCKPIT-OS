"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.sessions = (0, pg_core_1.pgTable)('sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at', { withTimezone: true }),
    ip: (0, pg_core_1.varchar)('ip', { length: 45 }),
    userAgent: (0, pg_core_1.varchar)('user_agent', { length: 500 }),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: (0, pg_core_1.index)('sessions_expires_at_idx').on(table.expiresAt),
}));
//# sourceMappingURL=sessions.js.map