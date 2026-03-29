import { z } from "zod";

/**
 * EasyFinder API — environment validation
 * Fails fast with readable errors on startup.
 * No secrets are ever logged or exposed via endpoints.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Server
  PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 8080))
    .refine((n) => Number.isFinite(n) && n > 0 && n < 65536, "PORT must be a valid port number"),

  // Demo mode — serves seeded listings instead of hitting the DB
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  // Auth — required, minimum 16 chars
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters"),

  // CORS — comma-separated list of allowed origins
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .refine((arr) => arr.length > 0, "CORS_ORIGINS must include at least one origin"),

  // PostgreSQL — optional, falls back to demo data if not set
  DB_USER:     z.string().optional(),
  DB_HOST:     z.string().optional(),
  DB_NAME:     z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 5432)),

  // Stripe — optional, payments disabled if not set
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PRICE_ID:   z.string().optional(),
  CLIENT_URL:        z.string().optional().default("http://localhost:5173"),

  // Anthropic — optional, AI broker disabled if not set
  ANTHROPIC_API_KEY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    "❌ Invalid environment variables:\n" +
      parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")
  );
}

export const env = parsed.data;
