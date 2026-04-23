import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { UserRole, useAuth } from "../lib/auth";
import { getMe } from "../lib/api";
import { Billing, canUseSellerCsvUpload } from "../lib/billing";
import { useRuntime } from "../lib/runtime";
import {
  canAccessSection,
  displayRoleLabel,
  shouldShowUpgrade,
} from "../lib/roles";
import DemoBanner from "./DemoBanner";

const NDA_WARNING_TEXT = "NDA must be accepted before accessing this resource.";

function formatPlanLabel(billing?: Billing) {
  const plan = billing?.plan ?? "free";
  const status = billing?.status ?? null;

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (plan === "free") return "Free";

  if (plan === "pro" && billing?.promoActive === true) {
    return "Pro (promo)";
  }

  let label = cap(plan);
  if (status && status !== "active") {
    label += ` (${status.split("_").join(" ")})`;
  }
  return label;
}

const navSections = [
  {
    title: "Buyer",
    items: [
      { to: "/app/listings", label: "Listings" },
      { to: "/app/scoring", label: "Scoring" },
      { to: "/app/offers", label: "Offers" },
    ],
  },
  {
    title: "Seller",
    items: [
      { to: "/app/seller/dashboard", label: "Dashboard" },
      { to: "/app/seller/listings", label: "Listings" },
      { to: "/app/seller/inquiries", label: "Inquiries" },
      { to: "/app/seller/pipeline", label: "Pipeline" },
      { to: "/app/seller/add", label: "Add listing" },
      { to: "/app/seller/upload", label: "Upload listing" },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "/app/admin/overview", label: "Overview" },
      { to: "/app/admin/sources", label: "Sources" },
      { to: "/admin/listings", label: "Listings" },
      { to: "/admin/inquiries", label: "Inquiries" },
      { to: "/app/scoring", label: "Scoring" },
      { to: "/app/admin/sources", label: "Scrape" },
    ],
  },
  {
    title: "Enterprise",
    items: [{ to: "/app/settings", label: "Settings" }],
  },
  {
    title: "Upgrade",
    items: [{ to: "/app/upgrade", label: "Upgrade" }],
  },
];

const adminNavSection = {
  title: "Admin",
  items: [
    { to: "/app/admin", label: "Overview" },
    { to: "/app/admin/users", label: "Users" },
    { to: "/app/admin/listings", label: "Listings" },
    { to: "/app/admin/inquiries", label: "Inquiries" },
    { to: "/app/admin/sources", label: "Sources" },
    { to: "/app/admin/audit", label: "Audit" },
    { to: "/app/admin/settings", label: "Settings" },
  ],
};

export const AppShell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { user, token, clearSession } = useAuth();
  const location = useLocation();
  const { demoMode, hydrated } = useRuntime();
  const isDemoMode = demoMode;
  const showDemoBanner = demoMode;
  const [billing, setBilling] = useState<Billing | null>(null);
  const [meRole, setMeRole] = useState<UserRole>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    if (!token) {
      setBilling(null);
      setMeRole(null);
      setBillingError(null);
      setBillingLoading(false);
      return;
    }

    setBillingLoading(true);

    getMe()
      .then((data) => {
        if (!isActive) return;
        setBilling(data.billing ?? null);
        setMeRole(data.role ?? null);
        setBillingError(null);
      })
      .catch((error) => {
        if (!isActive) return;
        setBilling(null);
        setMeRole(null);
        setBillingError(
          error instanceof Error ? error.message : "Unable to load billing.",
        );
      })
      .finally(() => {
        if (!isActive) return;
        setBillingLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [location.pathname, location.search, token]);

  const effectiveRole = meRole ?? user?.role ?? null;
  const userRole = effectiveRole;
  const userRoleResolved =
    userRole === "enterprise"
      ? "enterprise"
      : userRole === "seller"
        ? "seller"
        : userRole === "buyer"
          ? "buyer"
          : userRole === "admin"
            ? "admin"
            : "demo";

  const planResolved = billing?.plan ?? "free";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-role", userRoleResolved);
    root.setAttribute("data-plan", planResolved);

    return () => {
      root.removeAttribute("data-role");
      root.removeAttribute("data-plan");
    };
  }, [planResolved, userRoleResolved]);

  const roleLabel = displayRoleLabel({ role: effectiveRole });
  const isAdminRole = effectiveRole === "admin";
  const isAdminShell =
    location.pathname.startsWith("/app/admin") || effectiveRole === "admin";
  const logoTarget = isAdminRole ? "/app/admin" : "/";
  const isShellLoading =
    !hydrated || billingLoading || (Boolean(token) && !user);
  const badgeLabel = isShellLoading ? "Loading…" : roleLabel;

  let listingLimitLabel = "25";

  if (
    billing?.plan !== "free" &&
    billing?.entitlements?.maxActiveListings === null
  ) {
    listingLimitLabel = "Unlimited";
  } else if (typeof billing?.entitlements?.maxActiveListings === "number") {
    listingLimitLabel = String(billing.entitlements.maxActiveListings);
  } else if (billing?.plan === "pro") {
    listingLimitLabel = "200";
  } else if (billing?.plan === "enterprise") {
    listingLimitLabel = "Unlimited";
  }
  const visibleSections = useMemo(() => {
    if (effectiveRole === "admin") {
      return [adminNavSection];
    }

    const csvUploadAllowed = canUseSellerCsvUpload(
      userRoleResolved,
      billing?.plan,
      billing?.entitlements?.csvUpload,
    );

    return navSections
      .map((section) => {
        if (section.title === "Seller") {
          return {
            ...section,
            items: section.items.filter((item) => {
              if (
                demoMode &&
                (item.label === "Add listing" ||
                  item.label === "Upload listing")
              ) {
                return false;
              }

              if (!csvUploadAllowed && item.label === "Upload listing") {
                return false;
              }

              return true;
            }),
          };
        }

        return section;
      })
      .filter((section) => {
        if (section.title === "Buyer") {
          return canAccessSection({ role: effectiveRole }, "buyer");
        }
        if (section.title === "Seller") {
          return (
            section.items.length > 0 &&
            canAccessSection({ role: effectiveRole }, "seller")
          );
        }
        if (section.title === "Admin") {
          return canAccessSection({ role: effectiveRole }, "admin");
        }
        if (section.title === "Enterprise") {
          return canAccessSection({ role: effectiveRole }, "enterprise");
        }
        if (section.title === "Upgrade") {
          return (
            canAccessSection({ role: effectiveRole }, "upgrade") &&
            shouldShowUpgrade({ role: effectiveRole })
          );
        }
        return false;
      });
  }, [
    billing?.entitlements?.csvUpload,
    billing?.plan,
    demoMode,
    effectiveRole,
    userRoleResolved,
  ]);

  if (isAdminShell) {
    return (
      <div
        className={`min-h-screen text-slate-100 ${className ?? ""}`}
        data-role={userRoleResolved}
        data-plan={planResolved}
      >
        {showDemoBanner ? <DemoBanner /> : null}
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen overflow-hidden text-slate-100 ${className ?? ""}`}
      data-role={userRoleResolved}
      data-plan={planResolved}
    >
      <div className="flex h-screen overflow-hidden">
        <aside className="w-[260px] shrink-0 overflow-y-auto border-r border-slate-800/60 bg-slate-900/70 px-6 py-8">
          <Link to={logoTarget} className="text-xl font-semibold text-white">
            Easy Finder AI
          </Link>
          <p className="mt-2 text-xs text-slate-400">Role: {roleLabel}</p>
          {!isAdminRole ? (
            <p className="text-xs text-slate-400">
              Plan: {formatPlanLabel(billing ?? undefined)}
            </p>
          ) : null}
          {userRoleResolved === "seller" ? (
            <p className="text-xs text-slate-400">
              Listings: {listingLimitLabel}
            </p>
          ) : null}
          {billingError && billingError !== NDA_WARNING_TEXT ? (
            <p className="mt-2 text-xs text-rose-400">{billingError}</p>
          ) : null}
          {user?.ndaAccepted === false ? (
            <p className="mt-2 text-xs text-rose-400">{NDA_WARNING_TEXT}</p>
          ) : null}
          <nav className="mt-8 space-y-6">
            {visibleSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block rounded-xl px-3 py-2 text-sm ${
                          isActive
                            ? "bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent))]"
                            : "text-slate-400 hover:text-white"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          {user ? (
            <Button
              variant="outline"
              className="mt-8 w-full"
              onClick={() => clearSession()}
            >
              Log out
            </Button>
          ) : (
            <Link to="/login" className="mt-8 block">
              <Button className="w-full">Sign in</Button>
            </Link>
          )}
        </aside>
        <div className="flex flex-1 min-w-0">
          {showDemoBanner ? <DemoBanner /> : null}
          <main className="flex-1 min-w-0 h-screen overflow-y-auto px-6 py-6">
            <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {user?.ndaAccepted
                    ? "Welcome back"
                    : "Welcome to Easy Finder AI"}
                </h2>
                <p className="text-sm text-slate-400">
                  Premium equipment intelligence
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isDemoMode ? (
                  <button
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
                    onClick={() =>
                      document.documentElement.classList.toggle("dark")
                    }
                  >
                    Switch Mode
                  </button>
                ) : null}
                <div className="rounded-full border border-[rgb(var(--accent)/0.45)] px-4 py-2 text-xs text-[rgb(var(--accent))]">
                  {badgeLabel}
                </div>
                <div className="rounded-full bg-slate-800 px-3 py-2 text-xs text-slate-200">
                  {user?.email ?? "demo"}
                </div>
              </div>
            </header>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
