"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiTokens = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.apiTokens = (0, pg_core_1.pgTable)('api_tokens', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => users_1.users.id),
    tokenHash: (0, pg_core_1.varchar)('token_hash', { length: 255 }).notNull().unique(),
    label: (0, pg_core_1.varchar)('label', { length: 255 }),
    lastUsedAt: (0, pg_core_1.timestamp)('last_used_at'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
//# sourceMappingURL=api_tokens.js.map