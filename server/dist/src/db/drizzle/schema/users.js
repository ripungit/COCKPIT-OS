"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    username: (0, pg_core_1.varchar)('username', { length: 100 }).notNull().unique(),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 100 }).notNull(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }),
    marketingOptIn: (0, pg_core_1.boolean)('marketing_opt_in').notNull().default(false),
    role: (0, pg_core_1.varchar)('role', { length: 20 }).notNull().default('user'),
    wallpaperId: (0, pg_core_1.integer)('wallpaper_id').default(28),
    otp: (0, pg_core_1.varchar)('otp', { length: 20 }),
    otpExpiresAt: (0, pg_core_1.timestamp)('otp_expires_at', { withTimezone: true }),
    isEmailVerified: (0, pg_core_1.boolean)('is_email_verified').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    emailIdx: (0, pg_core_1.index)('users_email_idx').on(table.email),
    usernameIdx: (0, pg_core_1.index)('users_username_idx').on(table.username),
}));
//# sourceMappingURL=users.js.map