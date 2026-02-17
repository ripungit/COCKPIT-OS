"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.artifacts = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const projects_1 = require("./projects");
const deployments_1 = require("./deployments");
exports.artifacts = (0, pg_core_1.pgTable)('artifacts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id').notNull().references(() => projects_1.projects.id),
    deploymentId: (0, pg_core_1.uuid)('deployment_id').notNull().references(() => deployments_1.deployments.id),
    r2Key: (0, pg_core_1.varchar)('r2_key', { length: 500 }).notNull().unique(),
    sha256: (0, pg_core_1.varchar)('sha256', { length: 64 }).notNull(),
    sizeBytes: (0, pg_core_1.bigint)('size_bytes', { mode: 'number' }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
//# sourceMappingURL=artifacts.js.map