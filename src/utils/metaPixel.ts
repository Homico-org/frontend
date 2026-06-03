// Fire a Meta Pixel (fbq) event if the pixel is loaded. No-op on the server,
// or when fbq is missing (e.g. an ad blocker stripped fbevents.js) - callers
// never need to guard. The base pixel is initialized in app/layout.tsx.
//
// Standard events use `track`; custom events use `trackCustom` (pass
// { custom: true }).
export function trackPixel(
  event: string,
  opts?: { custom?: boolean; params?: Record<string, unknown> },
): void {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
  if (typeof fbq !== "function") return;
  const verb = opts?.custom ? "trackCustom" : "track";
  if (opts?.params) fbq(verb, event, opts.params);
  else fbq(verb, event);
}
