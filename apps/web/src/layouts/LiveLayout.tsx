import { ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { ModeLayout } from "./ModeLayout";

export const LiveLayout = ({ children }: { children: ReactNode }) => (
  <ModeLayout mode="live">
    <AppShell>{children}</AppShell>
  </ModeLayout>
);
