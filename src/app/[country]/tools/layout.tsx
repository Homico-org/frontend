"use client";

import type { ReactNode } from "react";
// Path was `../(shell)/layout` when this lived at `app/tools/`. After
// the 2026-05 move to `app/[country]/tools/`, the (shell) sibling is
// one level up.
import ShellLayout from "../../(shell)/layout";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <ShellLayout>{children}</ShellLayout>;
}

