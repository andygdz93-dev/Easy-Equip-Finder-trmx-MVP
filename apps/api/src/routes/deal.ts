import { FastifyInstance } from "fastify";
import { evaluateDeal } from "../lib/dealEngine.js";

export async function dealRoutes(app: FastifyInstance) {
  app.post("/deal/evaluate", async (req, reply) => {
    try {
      const input = req.body as any;
      if (!input?.listing_id || !input?.asking_price || !input?.category)
        return reply.status(400).send({ error: "Missing required fields: listing_id, asking_price, category" });
      return reply.send({ data: evaluateDeal(input) });
    } catch (e: any) {
      app.log.error(e, "deal/evaluate error");
      return reply.status(500).send({ error: "Deal engine error", detail: e.message });
    }
  });

  app.get("/deal/health", async (_req, reply) =>
    reply.send({ status: "ok", engine: "dealEngine.ts", version: "1.0.0" })
  );
}
