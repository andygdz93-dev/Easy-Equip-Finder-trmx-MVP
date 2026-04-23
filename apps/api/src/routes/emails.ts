import { FastifyInstance } from "fastify";
import { evaluateDeal } from "../lib/dealEngine.js";
import { pool } from "../db.js";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

async function draftNegotiationEmail(deal: any, round: number, category: string) {
  const counter = deal.negotiation[round - 1];
  const prompt = `You are a professional equipment buyer. Draft a professional counter-offer email.

Deal: ${category}
Asking: $${deal.asking_price.toLocaleString()}
Fair Value: $${deal.fair_value.toLocaleString()}
Wear Penalty: $${deal.costs.wear_penalty.toLocaleString()}
Total Acquisition Cost: $${deal.costs.total_acquisition.toLocaleString()}
Current ROI: ${(deal.roi_at_ask * 100).toFixed(1)}%
Counter Price: $${counter?.counter_price.toLocaleString()}
Counter ROI: ${(counter?.achieved_roi * 100).toFixed(1)}%

Write a professional, concise counter-offer email (under 150 words). Include wear/hours analysis. No preamble.`;

  const fallbackEmail = `Subject: Counter-Offer: ${category}

Dear Seller,

Based on market analysis and wear assessment ($${deal.costs.wear_penalty.toLocaleString()} estimated), we propose $${counter?.counter_price.toLocaleString()} for your ${category}.

Best regards,
EasyFinder AI Broker`;

  if (!ANTHROPIC_KEY) return { email: fallbackEmail, fallback: true };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`API ${response.status}`);
    return { email: data?.content?.[0]?.text || "Failed to generate email", fallback: false };
  } catch (e: any) {
    console.error("Email generation error:", e.message);
    return { email: fallbackEmail, fallback: true };
  }
}

export default async function emailRoutes(app: FastifyInstance) {
  app.post("/draft-negotiation", { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const input = request.body as any;
      const { listing_id, asking_price, category, market_p50, hours, condition, round = 1 } = input;

      let deal: any;

      if (listing_id && !asking_price) {
        const result = await pool.query("SELECT * FROM listings WHERE id = $1 LIMIT 1", [listing_id]);
        const listing = result.rows[0];
        if (!listing) return reply.status(404).send({ error: "Listing not found" });
        deal = evaluateDeal({
          listing_id,
          asking_price:   Number(listing.price) ?? 0,
          category:       listing.category ?? "equipment",
          market_p50:     Number(listing.market_value) ?? null,
          hours:          Number(listing.hours) ?? null,
          condition:      listing.operable !== false ? "good" : "fair",
          operable:       listing.operable !== false,
          distance_miles: 150,
        });
      } else if (asking_price && category && market_p50) {
        deal = evaluateDeal({
          listing_id:     listing_id || "direct",
          asking_price,
          category,
          market_p50,
          hours:          hours ?? null,
          condition:      condition ?? "unknown",
          operable:       true,
          distance_miles: 120,
        });
      } else {
        return reply.status(400).send({
          error: "Provide listing_id OR (asking_price, category, market_p50)",
        });
      }

      if (deal.decision !== "NEGOTIATE") {
        return reply.send({
          decision: deal.decision,
          message:  deal.decision === "BUY" ? "Strong buy — accept at asking" : "Walk from deal",
          email:    null,
        });
      }

      const roundNum = Math.min(Math.max(round, 1), deal.negotiation.length || 1);
      const emailResult = await draftNegotiationEmail(deal, roundNum, category);

      return reply.send({
        decision:          deal.decision,
        round:             roundNum,
        counter_price:     deal.negotiation[roundNum - 1]?.counter_price,
        roi:               deal.negotiation[roundNum - 1]?.achieved_roi,
        wear_penalty:      deal.costs.wear_penalty,
        total_acquisition: deal.costs.total_acquisition,
        email:             emailResult.email,
        fallback:          emailResult.fallback,
      });
    } catch (e: any) {
      app.log.error(e, "email/draft error");
      return reply.status(500).send({ error: "Email generation failed", detail: e.message });
    }
  });
}
