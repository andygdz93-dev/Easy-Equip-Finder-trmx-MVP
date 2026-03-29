import type { FastifyInstance } from "fastify";
import { config }        from "../config.js";
import { pool }          from "../db.js";
import { sourceHealth, getScoringConfig } from "../store.js";

const startedAt = new Date().toISOString();
const startMs   = Date.now();

async function pingDb(): Promise<{ ok: boolean; latencyMs: number | null; error?: string }> {
  const t = Date.now();
  try {
    await pool.query("SELECT 1");
    return { ok: true, latencyMs: Date.now() - t };
  } catch (err: any) {
    return { ok: false, latencyMs: null, error: err?.message ?? "unavailable" };
  }
}

export default async function healthRoutes(app: FastifyInstance) {

  // GET /api/health — liveness probe, no DB call
  app.get("/health", async (_req, reply) => {
    reply.send({
      ok:        true,
      service:   "easyfinder-api",
      env:       config.nodeEnv,
      demoMode:  config.demoMode,
      uptimeSec: Math.floor((Date.now() - startMs) / 1000),
      startedAt,
    });
  });

  // GET /api/status — full readiness check
  app.get("/status", async (_req, reply) => {
    const db    = await pingDb();
    const score = getScoringConfig();

    const sources         = Array.from(sourceHealth.entries()).map(([name, data]) => ({ name, ...data }));
    const healthySources  = sources.filter(s => s.status === "healthy").length;
    const degradedSources = sources.filter(s => s.status === "degraded").length;
    const unknownSources  = sources.filter(s => s.status === "unknown").length;

    const weightSum = parseFloat(
      Object.values(score.weights as Record<string, number>)
        .reduce((a, b) => a + b, 0)
        .toFixed(2)
    );

    const envChecks = {
      JWT_SECRET:    Boolean(process.env.JWT_SECRET),
      DB_HOST:       Boolean(config.db.host),
      STRIPE:        Boolean(config.stripe.secretKey),
      CORS_ORIGINS:  config.corsOrigins.length > 0,
      DEMO_MODE:     config.demoMode,
    };

    const allOk = db.ok || config.demoMode;

    reply.status(allOk ? 200 : 503).send({
      ok:        allOk,
      service:   "easyfinder-api",
      env:       config.nodeEnv,
      uptimeSec: Math.floor((Date.now() - startMs) / 1000),
      startedAt,
      subsystems: {
        database: {
          ok:        db.ok,
          mode:      db.ok ? "postgres" : "demo_fallback",
          latencyMs: db.latencyMs,
          ...(db.error ? { error: db.error } : {}),
        },
        scoring: {
          ok:           true,
          activeConfig: score.id,
          configName:   score.name,
          weightSum,
          weightsValid: weightSum === 1.00,
        },
        sources: {
          total:    sources.length,
          healthy:  healthySources,
          degraded: degradedSources,
          unknown:  unknownSources,
          items:    sources,
        },
        env: envChecks,
      },
    });
  });
}
