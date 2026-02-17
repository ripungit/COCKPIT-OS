"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.ConfigFactory = ConfigFactory;
const zod_1 = require("zod");
const baseSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('9000'),
    DATABASE_URL: zod_1.z.string().url(),
    CORS_ORIGIN: zod_1.z.string().url().default('http://localhost:3000'),
    SESSION_TTL_SECONDS: zod_1.z.string().transform(Number).default('604800'),
    COOKIE_SECURE: zod_1.z.string().transform((val) => val === 'true').default('false'),
    COOKIE_SAMESITE: zod_1.z.enum(['lax', 'strict', 'none']).default('lax'),
    RP_NAME: zod_1.z.string().default('Cockpit Production'),
    RP_ID: zod_1.z.string().default('localhost'),
    RP_ORIGIN: zod_1.z.string().url().default('http://localhost:3000'),
    WEBAUTHN_CHALLENGE_TTL_SECONDS: zod_1.z.string().transform(Number).default('300'),
    THROTTLE_TTL: zod_1.z.string().transform(Number).default('60000'),
    THROTTLE_LIMIT: zod_1.z.string().transform(Number).default('10'),
});
const storageSchema = zod_1.z.object({
    R2_ACCOUNT_ID: zod_1.z.string(),
    R2_ACCESS_KEY_ID: zod_1.z.string(),
    R2_SECRET_ACCESS_KEY: zod_1.z.string(),
    R2_BUCKET: zod_1.z.string().default('cockpit-storage'),
    R2_PUBLIC_BASE_URL: zod_1.z.string().url().optional().or(zod_1.z.literal('')).default(''),
    R2_REGION: zod_1.z.string().default('auto'),
});
const cockpitSchema = zod_1.z.object({
    COCKPIT_SECRET_KEY: zod_1.z.string().min(32, 'Secret key must be at least 32 characters'),
});
const mailSchema = zod_1.z.object({
    SMTP_HOST: zod_1.z.string(),
    SMTP_PORT: zod_1.z.string().default('465').transform(Number),
    SMTP_SECURE: zod_1.z.string().default('true').transform((val) => val === 'true'),
    SMTP_USER: zod_1.z.string(),
    SMTP_PASS: zod_1.z.string(),
    FROM_EMAIL: zod_1.z.string().email(),
});
exports.envSchema = baseSchema.merge(storageSchema).merge(cockpitSchema).merge(mailSchema);
function ConfigFactory() {
    return {
        isGlobal: true,
        envFilePath: '.env',
        validate: (config) => {
            const result = exports.envSchema.safeParse(config);
            if (!result.success) {
                console.error('❌ Invalid environment variables:');
                console.error(result.error.format());
                throw new Error('Invalid environment variables');
            }
            return result.data;
        },
    };
}
//# sourceMappingURL=env.schema.js.map