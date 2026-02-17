"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarEvents = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.calendarEvents = (0, pg_core_1.pgTable)('calendar_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    startTime: (0, pg_core_1.timestamp)('start_time', { withTimezone: true }).notNull(),
    endTime: (0, pg_core_1.timestamp)('end_time', { withTimezone: true }).notNull(),
    color: (0, pg_core_1.varchar)('color', { length: 50 }).notNull().default('blue'),
    category: (0, pg_core_1.varchar)('category', { length: 50 }).notNull().default('Work'),
    location: (0, pg_core_1.varchar)('location', { length: 255 }),
    meta: (0, pg_core_1.jsonb)('meta'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('calendar_events_user_id_idx').on(table.userId),
    startTimeIdx: (0, pg_core_1.index)('calendar_events_start_time_idx').on(table.startTime),
}));
//# sourceMappingURL=calendar_events.js.map