"use client";

// Route-scoped error boundary for the main /jobs feed. Falls back to
// the shared RouteError UI (retry + go-home). Without this file, an
// error in the jobs feed bubbles to app/error.tsx and unmounts the
// shell chrome (sidebar, header), which is more disorienting than
// keeping the chrome and replacing just the feed body.
import RouteError from "@/components/common/RouteError";

export default RouteError;
