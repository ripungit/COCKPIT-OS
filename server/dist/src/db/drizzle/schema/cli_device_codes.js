"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cliDeviceCodes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.cliDeviceCodes = (0, pg_core_1.pgTable)('cli_device_codes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    deviceCode: (0, pg_core_1.varchar)('device_code', { length: 255 }).notNull().unique(),
    userCode: (0, pg_core_1.varchar)('user_code', { length: 255 }).notNull().unique(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('pending'),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    intervalSeconds: (0, pg_core_1.integer)('interval_seconds').notNull().default(2),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
//# sourceMappingURL=cli_device_codes.js.map