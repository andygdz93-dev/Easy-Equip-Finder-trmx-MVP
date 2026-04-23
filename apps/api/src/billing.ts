import type Stripe from "stripe";
import { env } from "./env.js";

export type BillingPlan = "free" | "pro" | "enterprise";
export type BillingStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "inactive";

export type BillingInfo = {
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: BillingPlan;
  status: BillingStatus;
  isPromo?: boolean;
  current_period_end: Date | null;
};

export const priceIdByPlan = {
  pro: env.STRIPE_PRICE_ID_PRO,
  enterprise: env.STRIPE_PRICE_ID_ENTERPRISE,
} as const;

export const defaultBilling = (): BillingInfo => ({
  plan: "free",
  status: "inactive",
  isPromo: false,
  current_period_end: new Date(0),
});

export const normalizeBilling = (
  billing?: Partial<BillingInfo> | null
): BillingInfo => {
  const fallback = defaultBilling();
  if (!billing) return fallback;
  const currentPeriodEnd =
    billing.current_period_end === null
      ? null
      : billing.current_period_end instanceof Date
        ? billing.current_period_end
        : billing.current_period_end
          ? new Date(billing.current_period_end)
          : fallback.current_period_end;
  return {
    ...fallback,
    ...billing,
    current_period_end: currentPeriodEnd,
  };
};

export const isBillingActive = (billing: BillingInfo) =>
  billing.status === "active" &&
  billing.current_period_end !== null &&
  billing.current_period_end.getTime() > Date.now();

export const planFromPriceId = (priceId?: string | null): BillingPlan => {
  if (!priceId) return "free";
  if (priceId === priceIdByPlan.pro) return "pro";
  if (priceId === priceIdByPlan.enterprise) return "enterprise";
  return "free";
};

export const planFromSubscription = (subscription: Stripe.Subscription): BillingPlan => {
  const priceId = subscription.items.data[0]?.price?.id;
  return planFromPriceId(priceId);
};

export const mapStripeStatus = (
  status: Stripe.Subscription.Status | string
): BillingStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "incomplete";
  }
};

export const billingFromSubscription = (
  subscription: Stripe.Subscription,
  planOverride?: BillingPlan,
  statusOverride?: BillingStatus
): BillingInfo => ({
  stripe_customer_id:
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id,
  stripe_subscription_id: subscription.id,
  plan: planOverride ?? planFromSubscription(subscription),
  status: statusOverride ?? mapStripeStatus(subscription.status),
  isPromo: false,
  current_period_end: (subscription as any).current_period_end
    ? new Date((subscription as any).current_period_end * 1000)
    : new Date(0),
});

export const serializeBilling = (billing: BillingInfo) => ({
  stripe_customer_id: billing.stripe_customer_id,
  stripe_subscription_id: billing.stripe_subscription_id,
  plan: billing.plan,
  status: billing.status,
  isPromo: Boolean(billing.isPromo),
  current_period_end: billing.current_period_end
    ? billing.current_period_end.toISOString()
    : null,
});
