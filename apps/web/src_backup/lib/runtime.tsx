import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getHealth } from "./api";

const readLocalDemoMode = () => (import.meta as any).env?.VITE_DEMO_MODE === "true";
const readLocalBillingEnabled = () => (import.meta as any).env?.VITE_BILLING_ENABLED === "true";

type RuntimeContextValue = {
  demoMode: boolean;
  billingEnabled: boolean;
  hydrated: boolean;
};

const defaultRuntime: RuntimeContextValue = {
  demoMode: readLocalDemoMode(),
  billingEnabled: readLocalBillingEnabled(),
  hydrated: true,
};

const RuntimeContext = createContext<RuntimeContextValue>(defaultRuntime);

export const RuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [demoMode, setDemoMode] = useState(readLocalDemoMode);
  const [billingEnabled, setBillingEnabled] = useState(readLocalBillingEnabled);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    getHealth()
      .then((health) => {
        if (!isActive) return;
        setDemoMode(health.demoMode);
        setBillingEnabled(health.billingEnabled);
      })
      .catch(() => {
        // Keep safe defaults when health cannot be loaded.
      })
      .finally(() => {
        if (!isActive) return;
        setHydrated(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo(
    () => ({ demoMode, billingEnabled, hydrated }),
    [billingEnabled, demoMode, hydrated]
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
};

export const useRuntime = () => {
  return useContext(RuntimeContext);
};
