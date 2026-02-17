"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.nodes = (0, pg_core_1.pgTable)('nodes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull().unique(),
    baseDomain: (0, pg_core_1.varchar)('base_domain', { length: 255 }).notNull(),
    agentKeyHash: (0, pg_core_1.varchar)('agent_key_hash', { length: 255 }).notNull(),
    capabilities: (0, pg_core_1.jsonb)('capabilities').notNull(),
    buildSlotsTotal: (0, pg_core_1.integer)('build_slots_total').notNull(),
    runtimeSlotsTotal: (0, pg_core_1.integer)('runtime_slots_total').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
//# sourceMappingURL=nodes.js.map