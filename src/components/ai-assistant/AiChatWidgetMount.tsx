"use client";

/**
 * Renders the AiChatWidget on every page EXCEPT the landing page, the
 * registration / onboarding flows, and the auth flows (where it
 * competes with the main onboarding CTAs and distracts users mid
 * sign-in / password-reset). Keeping the suppression list here
 * (rather than scattered "if pathname" checks inside the widget)
 * means future flows just need to be added to this single switch.
 */

import { usePathname } from "next/navigation";
import { AiChatWidget } from ".";

const HIDDEN_PREFIXES = [
  "/register",
  "/pro/profile-setup",
  // Auth flows - the widget sits on top of the password / OTP form
  // on small screens and adds visual noise to a single-task flow.
  "/login",
  "/forgot-password",
];

const HIDDEN_EXACT = new Set(["/"]);

export function AiChatWidgetMount() {
  const pathname = usePathname() || "/";
  if (HIDDEN_EXACT.has(pathname)) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <AiChatWidget />;
}
