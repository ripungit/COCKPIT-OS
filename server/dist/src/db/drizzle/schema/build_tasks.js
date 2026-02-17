"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTasks = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const deployments_1 = require("./deployments");
const nodes_1 = require("./nodes");
exports.buildTasks = (0, pg_core_1.pgTable)('build_tasks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    deploymentId: (0, pg_core_1.uuid)('deployment_id').notNull().references(() => deployments_1.deployments.id),
    nodeId: (0, pg_core_1.uuid)('node_id').notNull().references(() => nodes_1.nodes.id),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull().default('build_and_deploy'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('queued'),
    leaseExpiresAt: (0, pg_core_1.timestamp)('lease_expires_at'),
    attempts: (0, pg_core_1.integer)('attempts').notNull().default(0),
    payload: (0, pg_core_1.jsonb)('payload'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
//# sourceMappingURL=build_tasks.js.map