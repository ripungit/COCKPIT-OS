"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passkeys = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.passkeys = (0, pg_core_1.pgTable)('passkeys', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    credentialId: (0, pg_core_1.text)('credential_id').notNull().unique(),
    publicKey: (0, pg_core_1.text)('public_key').notNull(),
    counter: (0, pg_core_1.integer)('counter').notNull().default(0),
    deviceType: (0, pg_core_1.text)('device_type'),
    backedUp: (0, pg_core_1.boolean)('backed_up').notNull().default(false),
    transports: (0, pg_core_1.jsonb)('transports').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('passkeys_user_id_idx').on(table.userId),
    credentialIdIdx: (0, pg_core_1.index)('passkeys_credential_id_idx').on(table.credentialId),
}));
//# sourceMappingURL=passkeys.js.map