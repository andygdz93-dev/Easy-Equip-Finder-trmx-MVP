import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getMe } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Billing, isBillingActive } from "../lib/billing";

export const RequireEnterprise = ({ children }: { children?: React.ReactNode }) => {
  const { token } = useAuth();
  const location = useLocation();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    if (!token) {
      setBilling(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getMe()
      .then((data) => {
        if (!isActive) return;
        setBilling(data.billing ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        setBilling(null);
        setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  const enterpriseActive =
    isBillingActive(billing) && billing?.plan === "enterprise";

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
        Checking subscription...
      </div>
    );
  }

  if (!enterpriseActive) {
    return <Navigate to="/app/upgrade" replace state={{ from: location.pathname }} />;
  }

  return <>{children ?? <Outlet />}</>;
};
