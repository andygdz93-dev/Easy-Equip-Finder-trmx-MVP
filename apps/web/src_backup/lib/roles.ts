import type { UserRole } from "./auth";

export type RoleAwareUser = {
  role?: UserRole;
} | null;

export type AppSection =
  | "buyer"
  | "seller"
  | "enterprise"
  | "upgrade"
  | "admin";

export const isAdmin = (user: RoleAwareUser): boolean => user?.role === "admin";

export const canAccessSection = (
  user: RoleAwareUser,
  section: AppSection,
): boolean => {
  if (isAdmin(user)) return true;

  switch (section) {
    case "buyer":
      return user?.role === "buyer" || user?.role === "enterprise";
    case "seller":
      return user?.role === "seller";
    case "enterprise":
      return user?.role === "enterprise";
    case "upgrade":
      return true;
    case "admin":
      return user?.role === "admin";
    default:
      return false;
  }
};

export const displayRoleLabel = (
  user: RoleAwareUser,
): "Admin" | "Seller" | "Enterprise" | "Buyer" => {
  if (isAdmin(user)) return "Admin";
  if (user?.role === "seller") return "Seller";
  if (user?.role === "enterprise") return "Enterprise";
  return "Buyer";
};

export const shouldShowUpgrade = (user: RoleAwareUser): boolean =>
  !isAdmin(user);
