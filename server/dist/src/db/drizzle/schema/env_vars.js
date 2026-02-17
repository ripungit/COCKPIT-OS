"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envVars = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const environments_1 = require("./environments");
exports.envVars = (0, pg_core_1.pgTable)('env_vars', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    environmentId: (0, pg_core_1.uuid)('environment_id').notNull().references(() => environments_1.environments.id),
    key: (0, pg_core_1.varchar)('key', { length: 255 }).notNull(),
    valueEncrypted: (0, pg_core_1.text)('value_encrypted').notNull(),
    isSecret: (0, pg_core_1.boolean)('is_secret').notNull().default(false),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
//# sourceMappingURL=env_vars.js.map