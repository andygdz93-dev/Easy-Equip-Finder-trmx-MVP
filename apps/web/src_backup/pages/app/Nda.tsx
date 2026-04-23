import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { acceptNda, getMe } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const NDA_SUMMARY = [
  "Keep EasyFinder data, pricing, and customer details confidential.",
  "Do not share reports, listings, or analytics outside your organization.",
  "Use the platform only for evaluating equipment sourcing opportunities.",
];

const NDA_TEXT = `This Non-Disclosure Agreement (NDA) is entered into between you and EasyFinder.
By accessing the LIVE platform, you agree to protect confidential information, including data,
pricing, customer information, and analytics. You may use this information solely to evaluate
equipment sourcing opportunities through EasyFinder. You may not disclose, copy, or distribute
confidential materials without written consent. This obligation continues even after you stop
using the platform.`;

export const Nda = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, user } = useAuth();
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackPath = useMemo(() => {
    if (user?.role === "seller" || user?.role === "enterprise") {
      return "/app/seller/dashboard";
    }
    return "/app/listings";
  }, [user?.role]);

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    if (!next) {
      return fallbackPath;
    }

    const isValidInApp = next.startsWith("/app/") && !next.startsWith("//") && !next.includes("://");
    return isValidInApp ? next : fallbackPath;
  }, [fallbackPath, location.search]);

  const handleContinue = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await acceptNda();
      const updated = await getMe();
      setUser(updated);
      if (updated.role === "seller") {
        navigate("/app/seller/dashboard", { replace: true });
        return;
      }
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept NDA.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Live access required</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Non-Disclosure Agreement (NDA)
        </h1>
      </div>

      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
        {NDA_SUMMARY.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          Agreement text
        </p>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
          {NDA_TEXT}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(event) => setIsChecked(event.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-400 focus:ring-emerald-400"
        />
        I agree to the NDA
      </label>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!isChecked || isSubmitting}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Continue"}
      </button>
    </div>
  );
};
