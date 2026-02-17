"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cocktailProcessesLatest = exports.cocktailFsCache = exports.cocktailUploads = exports.cocktailTransfers = exports.cocktailMetricsLatest = exports.cocktailTasks = exports.cocktailEnrollmentTokens = exports.cocktailDeviceSecrets = exports.cocktailDevices = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const cockpit_1 = require("./cockpit");
exports.cocktailDevices = (0, pg_core_1.pgTable)('cocktail_devices', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    vpsId: (0, pg_core_1.uuid)('vps_id')
        .notNull()
        .references(() => cockpit_1.cockpitVps.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('enrolling'),
    lastSeenAt: (0, pg_core_1.timestamp)('last_seen_at', { withTimezone: true }),
    enrolledAt: (0, pg_core_1.timestamp)('enrolled_at', { withTimezone: true }),
    disabledAt: (0, pg_core_1.timestamp)('disabled_at', { withTimezone: true }),
    agentVersion: (0, pg_core_1.text)('agent_version'),
    os: (0, pg_core_1.text)('os'),
    arch: (0, pg_core_1.text)('arch'),
    hostname: (0, pg_core_1.text)('hostname'),
    lastIp: (0, pg_core_1.text)('last_ip'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('cocktail_devices_user_id_idx').on(table.userId),
    vpsIdIdx: (0, pg_core_1.index)('cocktail_devices_vps_id_idx').on(table.vpsId),
    statusIdx: (0, pg_core_1.index)('cocktail_devices_status_idx').on(table.status),
    lastSeenIdx: (0, pg_core_1.index)('cocktail_devices_last_seen_at_idx').on(table.lastSeenAt),
    uniqueVps: (0, pg_core_1.unique)('cocktail_devices_vps_id_unique').on(table.vpsId),
}));
exports.cocktailDeviceSecrets = (0, pg_core_1.pgTable)('cocktail_device_secrets', {
    deviceId: (0, pg_core_1.uuid)('device_id')
        .primaryKey()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    secretHash: (0, pg_core_1.text)('secret_hash').notNull(),
    encryptedSecret: (0, pg_core_1.text)('encrypted_secret'),
    secretCreatedAt: (0, pg_core_1.timestamp)('secret_created_at', { withTimezone: true }).notNull().defaultNow(),
    secretLastUsedAt: (0, pg_core_1.timestamp)('secret_last_used_at', { withTimezone: true }),
    rotatedAt: (0, pg_core_1.timestamp)('rotated_at', { withTimezone: true }),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
});
exports.cocktailEnrollmentTokens = (0, pg_core_1.pgTable)('cocktail_enrollment_tokens', {
    tokenHash: (0, pg_core_1.text)('token_hash').primaryKey(),
    deviceId: (0, pg_core_1.uuid)('device_id')
        .notNull()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    usedAt: (0, pg_core_1.timestamp)('used_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.cocktailTasks = (0, pg_core_1.pgTable)('cocktail_tasks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    deviceId: (0, pg_core_1.uuid)('device_id')
        .notNull()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.text)('type').notNull(),
    payload: (0, pg_core_1.jsonb)('payload').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('queued'),
    leaseId: (0, pg_core_1.text)('lease_id'),
    leasedAt: (0, pg_core_1.timestamp)('leased_at', { withTimezone: true }),
    leaseExpiresAt: (0, pg_core_1.timestamp)('lease_expires_at', { withTimezone: true }),
    attempts: (0, pg_core_1.integer)('attempts').default(0),
    result: (0, pg_core_1.jsonb)('result'),
    error: (0, pg_core_1.text)('error'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    deviceStatusIdx: (0, pg_core_1.index)('cocktail_tasks_device_id_status_idx').on(table.deviceId, table.status),
    statusLeaseExpIdx: (0, pg_core_1.index)('cocktail_tasks_status_lease_expires_at_idx').on(table.status, table.leaseExpiresAt),
}));
exports.cocktailMetricsLatest = (0, pg_core_1.pgTable)('cocktail_metrics_latest', {
    deviceId: (0, pg_core_1.uuid)('device_id')
        .primaryKey()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    metrics: (0, pg_core_1.jsonb)('metrics').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.cocktailTransfers = (0, pg_core_1.pgTable)('cocktail_transfers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    deviceId: (0, pg_core_1.uuid)('device_id')
        .notNull()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull(),
    path: (0, pg_core_1.text)('path').notNull(),
    sizeBytes: (0, pg_core_1.integer)('size_bytes'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('pending'),
    error: (0, pg_core_1.text)('error'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    deviceStatusIdx: (0, pg_core_1.index)('cocktail_transfers_device_id_status_idx').on(table.deviceId, table.status),
    userIdIdx: (0, pg_core_1.index)('cocktail_transfers_user_id_idx').on(table.userId),
}));
exports.cocktailUploads = (0, pg_core_1.pgTable)('cocktail_uploads', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    deviceId: (0, pg_core_1.uuid)('device_id')
        .notNull()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    vpsId: (0, pg_core_1.uuid)('vps_id')
        .notNull()
        .references(() => cockpit_1.cockpitVps.id, { onDelete: 'cascade' }),
    objectKey: (0, pg_core_1.text)('object_key').notNull(),
    filename: (0, pg_core_1.text)('filename').notNull(),
    sizeBytes: (0, pg_core_1.integer)('size_bytes').notNull(),
    mimeType: (0, pg_core_1.text)('mime_type'),
    destPath: (0, pg_core_1.text)('dest_path').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('INIT'),
    sha256: (0, pg_core_1.text)('sha256'),
    taskId: (0, pg_core_1.uuid)('task_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('cocktail_uploads_user_id_idx').on(table.userId),
    vpsIdIdx: (0, pg_core_1.index)('cocktail_uploads_vps_id_idx').on(table.vpsId),
    statusIdx: (0, pg_core_1.index)('cocktail_uploads_status_idx').on(table.status),
}));
exports.cocktailFsCache = (0, pg_core_1.pgTable)('cocktail_fs_cache', {
    deviceId: (0, pg_core_1.uuid)('device_id')
        .notNull()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    path: (0, pg_core_1.text)('path').notNull(),
    items: (0, pg_core_1.jsonb)('items').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    pk: (0, pg_core_1.unique)('cocktail_fs_cache_pk').on(table.deviceId, table.path),
    devicePathIdx: (0, pg_core_1.index)('cocktail_fs_cache_device_path_idx').on(table.deviceId, table.path),
}));
exports.cocktailProcessesLatest = (0, pg_core_1.pgTable)('cocktail_processes_latest', {
    deviceId: (0, pg_core_1.uuid)('device_id')
        .primaryKey()
        .references(() => exports.cocktailDevices.id, { onDelete: 'cascade' }),
    items: (0, pg_core_1.jsonb)('items').notNull(),
    capturedAt: (0, pg_core_1.timestamp)('captured_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
//# sourceMappingURL=cocktail.js.map