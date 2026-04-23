import { env } from "./env.js";

export type SellerPlan = "free" | "pro" | "enterprise";

type SellerEntitlements = {
  maxActiveListings: number | null;
  csvUpload: boolean;
  marketplaceIntegrations: boolean;
  promoActive: boolean;
  promoEndsAt: string | null;
};

const addMonthsUtc = (date: Date, months: number) => {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

const launchDate = new Date(env.LAUNCH_DATE);
const promoEndsAt = addMonthsUtc(launchDate, 6);

export const getSellerEntitlements = ({
  plan,
  role,
  now = new Date(),
}: {
  plan: SellerPlan;
  role?: string | null;
  now?: Date;
}): SellerEntitlements => {
  const normalizedPlan: SellerPlan = role === "enterprise" ? "enterprise" : plan;

  const promoIsActive = normalizedPlan === "pro" && now.getTime() < promoEndsAt.getTime();

  if (normalizedPlan === "enterprise") {
    return {
      maxActiveListings: null,
      csvUpload: true,
      marketplaceIntegrations: true,
      promoActive: false,
      promoEndsAt: null,
    };
  }

  if (normalizedPlan === "pro") {
    return {
      maxActiveListings: 200,
      csvUpload: true,
      marketplaceIntegrations: false,
      promoActive: promoIsActive,
      promoEndsAt: promoEndsAt.toISOString(),
    };
  }

  return {
    maxActiveListings: 25,
    csvUpload: false,
    marketplaceIntegrations: false,
    promoActive: false,
    promoEndsAt: null,
  };
};


export type BuyerEntitlements = {
  scoring: "limited" | "enhanced" | "full";
  marketplaceAccess: "limited" | "full";
};

export const getBuyerEntitlements = ({
  plan,
}: {
  plan: SellerPlan;
}): BuyerEntitlements => {
  if (plan === "enterprise") {
    return {
      scoring: "full",
      marketplaceAccess: "full",
    };
  }

  if (plan === "pro") {
    return {
      scoring: "enhanced",
      marketplaceAccess: "limited",
    };
  }

  return {
    scoring: "limited",
    marketplaceAccess: "limited",
  };
};
