import Stripe from "stripe";
import { env } from "./env.js";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing. Stripe features are disabled.");
  }
  stripeClient = new Stripe(key, { apiVersion: "2026-02-25.clover" as any });
  return stripeClient;
}

export function requireStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is missing. Webhook verification cannot run."
    );
  }
  return secret;
}
