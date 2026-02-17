"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const drizzle_service_1 = require("./src/db/drizzle/drizzle.service");
const drizzle_orm_1 = require("drizzle-orm");
async function bootstrap() {
    console.log('Initializing application context...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const drizzle = app.get(drizzle_service_1.DrizzleService);
    const db = drizzle.db;
    console.log('Cleaning database...');
    try {
        await db.execute(drizzle_orm_1.sql.raw(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        `));
        console.log('✅ Database cleaned successfully');
    }
    catch (error) {
        console.error('❌ Error cleaning database:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=clean-data.js.map