import { z } from 'zod';

// Base schema
const baseSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('9000'),
    DATABASE_URL: z.string().url(),
    CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
    SESSION_TTL_SECONDS: z.string().transform(Number).default('604800'),
    COOKIE_SECURE: z.string().transform((val) => val === 'true').default('false'),
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    RP_NAME: z.string().default('Cockpit Production'),
    RP_ID: z.string().default('localhost'),
    RP_ORIGIN: z.string().url().default('http://localhost:3000'),
    WEBAUTHN_CHALLENGE_TTL_SECONDS: z.string().transform(Number).default('300'),
    THROTTLE_TTL: z.string().transform(Number).default('60000'),
    THROTTLE_LIMIT: z.string().transform(Number).default('10'),
});

// Storage Schema (R2) - Used by Cocktail
const storageSchema = z.object({
    R2_ACCOUNT_ID: z.string(),
    R2_ACCESS_KEY_ID: z.string(),
    R2_SECRET_ACCESS_KEY: z.string(),
    R2_BUCKET: z.string().default('cockpit-storage'),
    R2_PUBLIC_BASE_URL: z.string().url().optional().or(z.literal('')).default(''),
    R2_REGION: z.string().default('auto'),
});

// Cockpit Schema
const cockpitSchema = z.object({
    COCKPIT_SECRET_KEY: z.string().min(32, 'Secret key must be at least 32 characters'),
});

// Mail Schema (Zoho SMTP)
const mailSchema = z.object({
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string().default('465').transform(Number),
    SMTP_SECURE: z.string().default('true').transform((val) => val === 'true'),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    FROM_EMAIL: z.string().email(),
});

// Combine schemas
export const envSchema = baseSchema.merge(storageSchema).merge(cockpitSchema).merge(mailSchema);

export type Env = z.infer<typeof envSchema>;

export function ConfigFactory() {
    return {
        isGlobal: true,
        envFilePath: '.env',
        validate: (config: Record<string, unknown>) => {
            const result = envSchema.safeParse(config);
            if (!result.success) {
                console.error('❌ Invalid environment variables:');
                console.error(result.error.format());
                throw new Error('Invalid environment variables');
            }
            return result.data;
        },
    };
}