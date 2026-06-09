"use client";

/**
 * /post-job sits outside the `(shell)` route group on purpose so it isn't
 * wrapped by the dashboard sidebar - the multi-step form takes the whole
 * page width. But that meant it shipped with NO header at all, so users had
 * no way to get back to the rest of the site mid-flow. This minimal layout
 * just lays the global Header on top while keeping the form full-bleed.
 */

import Header from "@/components/common/Header";
import { ReactNode } from "react";

export default function PostJobLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--hm-bg-page)" }}
    >
      <Header fixed={false} />
      <main>{children}</main>
    </div>
  );
}
