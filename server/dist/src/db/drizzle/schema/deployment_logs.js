"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploymentLogs = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const deployments_1 = require("./deployments");
exports.deploymentLogs = (0, pg_core_1.pgTable)('deployment_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    deploymentId: (0, pg_core_1.uuid)('deployment_id').notNull().references(() => deployments_1.deployments.id),
    ts: (0, pg_core_1.timestamp)('ts').notNull().defaultNow(),
    level: (0, pg_core_1.varchar)('level', { length: 20 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
});
//# sourceMappingURL=deployment_logs.js.map