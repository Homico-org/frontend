"use client";

// Route-scoped error boundary for the job detail page. Catches
// runtime errors anywhere inside JobDetailClient (chat, proposals,
// status banner, etc.) without unmounting the shell-less header.
import RouteError from "@/components/common/RouteError";

export default RouteError;
