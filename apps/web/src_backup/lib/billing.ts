export type BillingPlan = "free" | "pro" | "enterprise";
export type BillingStatus = "active" | "past_due" | "canceled" | "incomplete" | "inactive";

export type Billing = {
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: BillingPlan;
  status: BillingStatus;
  isPromo?: boolean;
  current_period_end?: string;
  promo?: { endsAt?: string } | null;
  promoActive?: boolean;
  entitlements?: {
    csvUpload?: boolean;
    maxActiveListings?: number;
  };
};

export const canUseSellerCsvUpload = (
  role?: string | null,
  plan?: BillingPlan | null,
  entitlementCsvUpload?: boolean,
) => {
  if (role !== "seller") return false;
  if (entitlementCsvUpload === true) return true;
  return plan === "pro" || plan === "enterprise";
};

export const isBillingActive = (billing?: Billing | null) => {
  if (!billing) return false;
  if (billing.status !== "active") return false;
  if (!billing.current_period_end) return false;
  return new Date(billing.current_period_end).getTime() > Date.now();
};
