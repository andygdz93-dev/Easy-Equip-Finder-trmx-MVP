import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AuthApiError, useAuth } from "../../lib/auth";

const roleOptions = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "enterprise", label: "Enterprise" },
] as const;

export const SelectRole = () => {
  const navigate = useNavigate();
  const { setUserRole } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnterpriseUpgradeCta, setShowEnterpriseUpgradeCta] = useState(false);

  const handleSelectRole = async (role: (typeof roleOptions)[number]["value"]) => {
    setIsSaving(true);
    setError(null);
    setShowEnterpriseUpgradeCta(false);

    try {
      await setUserRole(role);
      if (role === "seller") {
        navigate("/app/seller/listings", { replace: true });
        return;
      }

      if (role === "enterprise") {
        navigate("/app/settings", { replace: true });
        return;
      }

      navigate("/app/listings", { replace: true });
    } catch (err) {
      const apiError = err as AuthApiError;
      if (apiError.code === "ROLE_NOT_ALLOWED" && role === "enterprise") {
        setError(apiError.message || "Enterprise access is not enabled for this account.");
        setShowEnterpriseUpgradeCta(true);
      } else {
        setError(apiError.message || "Unable to set role right now.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold text-white">Choose your role</h1>
        <p className="mt-2 text-sm text-slate-400">
          Select the role you want to use in Easy Finder AI.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {roleOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => handleSelectRole(option.value)}
              disabled={isSaving}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        {showEnterpriseUpgradeCta ? (
          <Button className="mt-4" onClick={() => navigate("/app/billing", { replace: true })}>
            Go to billing
          </Button>
        ) : null}
      </Card>
    </div>
  );
};
