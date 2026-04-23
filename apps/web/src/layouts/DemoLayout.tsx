import { ReactNode } from "react";
import { ModeLayout } from "./ModeLayout";

export const DemoLayout = ({ children }: { children: ReactNode }) => (
  <ModeLayout mode="demo">{children}</ModeLayout>
);
