export type SellerCapabilities = {
  canViewAnalytics: boolean;
  canBulkEdit: boolean;
  canPriorityPlacement: boolean;
  canExportLeads: boolean;
  canAutoRelist: boolean;
};

const SELLER_LAUNCH_MODE = true;

export function resolveSellerCapabilities(
  role: string | null | undefined,
  plan: string | null | undefined
): SellerCapabilities {
  const isSeller = role === "seller" || role === "enterprise";

  if (!isSeller) {
    return {
      canViewAnalytics: false,
      canBulkEdit: false,
      canPriorityPlacement: false,
      canExportLeads: false,
      canAutoRelist: false,
    };
  }

  if (SELLER_LAUNCH_MODE) {
    return {
      canViewAnalytics: true,
      canBulkEdit: true,
      canPriorityPlacement: true,
      canExportLeads: true,
      canAutoRelist: true,
    };
  }

  const isPro = plan === "pro" || plan === "enterprise";

  return {
    canViewAnalytics: isPro,
    canBulkEdit: isPro,
    canPriorityPlacement: isPro,
    canExportLeads: isPro,
    canAutoRelist: isPro,
  };
}
