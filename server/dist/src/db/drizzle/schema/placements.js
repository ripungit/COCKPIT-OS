"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placements = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const projects_1 = require("./projects");
const environments_1 = require("./environments");
const nodes_1 = require("./nodes");
exports.placements = (0, pg_core_1.pgTable)('placements', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    projectId: (0, pg_core_1.uuid)('project_id').notNull().references(() => projects_1.projects.id),
    environmentId: (0, pg_core_1.uuid)('environment_id').notNull().references(() => environments_1.environments.id),
    nodeId: (0, pg_core_1.uuid)('node_id').notNull().references(() => nodes_1.nodes.id),
    hostname: (0, pg_core_1.varchar)('hostname', { length: 255 }).notNull().unique(),
    activeDeploymentId: (0, pg_core_1.uuid)('active_deployment_id'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
//# sourceMappingURL=placements.js.map