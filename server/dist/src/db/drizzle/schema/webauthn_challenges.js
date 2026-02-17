"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webauthnChallenges = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.webauthnChallenges = (0, pg_core_1.pgTable)('webauthn_challenges', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    challenge: (0, pg_core_1.text)('challenge').notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('webauthn_challenges_user_id_idx').on(table.userId),
    expiresAtIdx: (0, pg_core_1.index)('webauthn_challenges_expires_at_idx').on(table.expiresAt),
}));
//# sourceMappingURL=webauthn_challenges.js.map