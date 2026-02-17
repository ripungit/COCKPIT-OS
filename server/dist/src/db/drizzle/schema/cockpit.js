"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cockpitNotes = exports.cockpitTerminalSessions = exports.cockpitVps = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.cockpitVps = (0, pg_core_1.pgTable)('cockpit_vps', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    host: (0, pg_core_1.varchar)('host', { length: 255 }).notNull(),
    port: (0, pg_core_1.integer)('port').notNull().default(22),
    username: (0, pg_core_1.varchar)('username', { length: 255 }).notNull(),
    encryptedPassword: (0, pg_core_1.text)('encrypted_password').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('pending'),
    serverFingerprint: (0, pg_core_1.varchar)('server_fingerprint', { length: 255 }),
    lastError: (0, pg_core_1.text)('last_error'),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at', { withTimezone: true }),
    meta: (0, pg_core_1.jsonb)('meta'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('cockpit_vps_user_id_idx').on(table.userId),
}));
exports.cockpitTerminalSessions = (0, pg_core_1.pgTable)('cockpit_terminal_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    vpsId: (0, pg_core_1.uuid)('vps_id')
        .notNull()
        .references(() => exports.cockpitVps.id, { onDelete: 'cascade' }),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('created'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    connectedAt: (0, pg_core_1.timestamp)('connected_at', { withTimezone: true }),
    closedAt: (0, pg_core_1.timestamp)('closed_at', { withTimezone: true }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
    meta: (0, pg_core_1.jsonb)('meta'),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('cockpit_terminal_sessions_user_id_idx').on(table.userId),
    vpsIdIdx: (0, pg_core_1.index)('cockpit_terminal_sessions_vps_id_idx').on(table.vpsId),
}));
exports.cockpitNotes = (0, pg_core_1.pgTable)('cockpit_notes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content').notNull().default(''),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('cockpit_notes_user_id_idx').on(table.userId),
}));
//# sourceMappingURL=cockpit.js.map