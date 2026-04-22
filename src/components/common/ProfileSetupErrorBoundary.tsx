"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Wraps profile-setup so a React rendering crash (e.g. error #310 during
 * the invite → profile-setup transition) doesn't leave the user on a blank
 * screen. Reloads the current route, which re-runs the client bundle from
 * scratch with a fresh hook stack.
 */
export default class ProfileSetupErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error("[ProfileSetup] render crash", error, info);
    // Auto-recover once per mount: the crash is typically a transient hook
    // mismatch during a rapid navigation transition. A full reload clears it.
    if (typeof window !== "undefined") {
      const recoveryKey = "profileSetupAutoReload";
      const already = sessionStorage.getItem(recoveryKey);
      if (!already) {
        sessionStorage.setItem(recoveryKey, String(Date.now()));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6 text-center"
          style={{ backgroundColor: "var(--hm-bg-page)" }}
        >
          <div>
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--hm-fg-primary)" }}
            >
              Reloading…
            </p>
            <p className="text-sm" style={{ color: "var(--hm-fg-secondary)" }}>
              Setting up your profile. If this persists, please refresh the
              page.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
