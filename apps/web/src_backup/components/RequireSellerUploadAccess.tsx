import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMe } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Billing, canUseSellerCsvUpload } from "../lib/billing";

export default function RequireSellerUploadAccess({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, isUserLoading } = useAuth();
  const location = useLocation();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    if (!token || !user || (user.role !== "seller" && user.role !== "admin")) {
      setBilling(null);
      setIsBillingLoading(false);
      return;
    }

    setIsBillingLoading(true);
    getMe()
      .then((data) => {
        if (!isActive) return;
        setBilling(data.billing ?? null);
      })
      .catch(() => {
        if (!isActive) return;
        setBilling(null);
      })
      .finally(() => {
        if (!isActive) return;
        setIsBillingLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token, user]);

  if (!token)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (isUserLoading || !user || isBillingLoading) {
    return <div className="p-6 text-slate-300">Loading…</div>;
  }

  const roleOk = user.role === "seller" || user.role === "admin";
  if (!roleOk) return <Navigate to="/app/select-role" replace />;

  const csvUploadAllowed = canUseSellerCsvUpload(
    user.role === "admin" ? "seller" : user.role,
    billing?.plan,
    billing?.entitlements?.csvUpload,
  );

  if (!csvUploadAllowed) return <Navigate to="/app/upgrade" replace />;

  return <>{children}</>;
}
