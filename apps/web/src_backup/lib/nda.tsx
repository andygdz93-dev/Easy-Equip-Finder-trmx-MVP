import { createContext, useContext, useMemo, useState } from "react";
import type { NdaStatus } from "./api";

type NdaContextValue = {
  status: NdaStatus | null;
  checked: boolean;
  setStatus: (status: NdaStatus | null) => void;
  setChecked: (checked: boolean) => void;
};

const NdaContext = createContext<NdaContextValue | undefined>(undefined);

export const NdaProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<NdaStatus | null>(null);
  const [checked, setChecked] = useState(false);

  const value = useMemo(
    () => ({ status, checked, setStatus, setChecked }),
    [status, checked]
  );

  return <NdaContext.Provider value={value}>{children}</NdaContext.Provider>;
};

export const useNda = () => {
  const context = useContext(NdaContext);
  if (!context) {
    throw new Error("useNda must be used within NdaProvider");
  }
  return context;
};
