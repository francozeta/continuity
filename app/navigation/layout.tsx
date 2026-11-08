import type { ReactNode } from "react";
import NavigationShell from "./navigation-shell";
import "./navigation.css";

export default function NavigationLayout({ children }: { children: ReactNode }) {
  return <NavigationShell>{children}</NavigationShell>;
}
