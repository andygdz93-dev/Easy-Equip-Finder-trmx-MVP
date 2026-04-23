import { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export const RequireLiveNda = () => {
  const { token, user, isUserLoading } = useAuth();
  const location = useLocation();

  const isNdaRoute = useMemo(
    () => location.pathname === "/app/nda",
    [location.pathname]
  );

  const nextPath = useMemo(
    () => `${location.pathname}${location.search}`,
    [location.pathname, location.search]
  );

  if (!token) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(nextPath)}`}
        replace
      />
    );
  }

  if (isNdaRoute) {
    return <Outlet />;
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        Checking NDA status...
      </div>
    );
  }

  if (user.ndaAccepted === false) {
    return <Navigate to={`/app/nda?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  return <Outlet />;
};
