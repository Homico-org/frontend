"use client";

import type { ReactNode } from "react";
import ShellLayout from "../(shell)/layout";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <ShellLayout>{children}</ShellLayout>;
}

