"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeHeartbeats = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const nodes_1 = require("./nodes");
exports.nodeHeartbeats = (0, pg_core_1.pgTable)('node_heartbeats', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    nodeId: (0, pg_core_1.uuid)('node_id').notNull().references(() => nodes_1.nodes.id),
    cpuPercent: (0, pg_core_1.real)('cpu_percent'),
    ramUsedMb: (0, pg_core_1.integer)('ram_used_mb'),
    ramTotalMb: (0, pg_core_1.integer)('ram_total_mb'),
    diskFreeGb: (0, pg_core_1.real)('disk_free_gb'),
    buildSlotsUsed: (0, pg_core_1.integer)('build_slots_used'),
    runtimeSlotsUsed: (0, pg_core_1.integer)('runtime_slots_used'),
    ts: (0, pg_core_1.timestamp)('ts').notNull().defaultNow(),
});
//# sourceMappingURL=node_heartbeats.js.map