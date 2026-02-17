"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployments = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const projects_1 = require("./projects");
const environments_1 = require("./environments");
exports.deployments = (0, pg_core_1.pgTable)('deployments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id').notNull().references(() => projects_1.projects.id),
    environmentId: (0, pg_core_1.uuid)('environment_id').notNull().references(() => environments_1.environments.id),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('queued'),
    sourceHash: (0, pg_core_1.varchar)('source_hash', { length: 255 }),
    depsHash: (0, pg_core_1.varchar)('deps_hash', { length: 255 }),
    artifactId: (0, pg_core_1.uuid)('artifact_id'),
    assignedNodeId: (0, pg_core_1.uuid)('assigned_node_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    finishedAt: (0, pg_core_1.timestamp)('finished_at'),
});
//# sourceMappingURL=deployments.js.map