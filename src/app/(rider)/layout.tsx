import type { ReactNode } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";

export default function RiderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-pixel-bg">
      <AppNavbar role="Rider" />
      <main className="flex-1">{children}</main>
    </div>
  );
}
