"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const drizzle_service_1 = require("./src/db/drizzle/drizzle.service");
const schema_1 = require("./src/db/drizzle/schema");
const argon2 = __importStar(require("argon2"));
const drizzle_orm_1 = require("drizzle-orm");
async function bootstrap() {
    console.log('Initializing application context...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const drizzle = app.get(drizzle_service_1.DrizzleService);
    const db = drizzle.db;
    const email = 'admin@example.com';
    const username = 'admin';
    const password = 'password123';
    const firstName = 'Admin';
    const lastName = 'User';
    console.log(`Creating user: ${username} (${email}) ...`);
    const [existing] = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
    if (existing) {
        console.log(`User ${username} already exists with ID: ${existing.id}`);
        const passwordHash = await argon2.hash(password);
        await db.update(schema_1.users).set({ passwordHash }).where((0, drizzle_orm_1.eq)(schema_1.users.id, existing.id));
        console.log('Password updated to: ' + password);
        await app.close();
        return;
    }
    const passwordHash = await argon2.hash(password);
    const [user] = await db.insert(schema_1.users).values({
        email,
        username,
        passwordHash,
        firstName,
        lastName,
        role: 'admin',
        marketingOptIn: false,
    }).returning();
    console.log('✅ User created successfully!');
    console.log('------------------------------------------------');
    console.log(`ID:       ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${password}`);
    console.log('------------------------------------------------');
    console.log('You can now log in with these credentials.');
    await app.close();
}
bootstrap().catch(err => {
    console.error('Failed to create user:', err);
    process.exit(1);
});
//# sourceMappingURL=create-user.js.map