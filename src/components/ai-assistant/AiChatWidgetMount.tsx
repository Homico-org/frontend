"use client";

/**
 * Renders the AiChatWidget on every page EXCEPT the landing page and the
 * registration flows (where it competes with the main onboarding CTAs and
 * confuses new users). Keeping the suppression list here (rather than
 * scattered "if pathname" checks inside the widget) means future flows
 * just need to be added to this single switch.
 */

import { usePathname } from "next/navigation";
import { AiChatWidget } from ".";

const HIDDEN_PREFIXES = [
  "/register",
  "/pro/profile-setup",
];

const HIDDEN_EXACT = new Set(["/"]);

export function AiChatWidgetMount() {
  const pathname = usePathname() || "/";
  if (HIDDEN_EXACT.has(pathname)) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <AiChatWidget />;
}
