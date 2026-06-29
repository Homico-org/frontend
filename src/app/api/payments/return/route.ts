import { NextRequest, NextResponse } from "next/server";

/**
 * Payment-gateway return bouncer.
 *
 * Flitt (and other Fondy-lineage gateways) redirect the customer back to the
 * `response_url` via a POST. Next.js App Router treats a POST to a page route
 * as a Server Action invocation and 500s with "Invalid Server Actions request".
 *
 * This route handler accepts that POST (and a plain GET) and 303-redirects the
 * browser to the real GET return page (`?to=`), which then polls the backend
 * reconcile endpoint for the actual payment status. We never read the POST
 * body - the return page reconciles by entity id from its own URL.
 *
 * Open-redirect guard: only same-origin targets are honoured.
 */
/**
 * The public origin as the browser sees it. Behind Render's proxy
 * `req.nextUrl.origin` is the internal `http://localhost:10000`, which makes
 * the same-origin guard reject the real return URL and fall back to a dead
 * localhost page. Trust the proxy's forwarded headers when present.
 */
function publicOrigin(req: NextRequest): string {
  const fwdHost = req.headers.get("x-forwarded-host");
  if (!fwdHost) return req.nextUrl.origin;
  const host = fwdHost.split(",")[0].trim();
  // Only trust the forwarded host if it's a known Homico domain. Render
  // resets inbound x-forwarded-* on its edge, but validating here means a
  // forged header can never turn the same-origin guard into an open redirect
  // (a bad host just falls back to the internal origin, which rejects `to`).
  const trusted =
    host === "homico.ge" ||
    host === "homico.co" ||
    host.endsWith(".homico.ge") ||
    host.endsWith(".homico.co");
  if (!trusted) return req.nextUrl.origin;
  const proto = (req.headers.get("x-forwarded-proto") || "https")
    .split(",")[0]
    .trim();
  return `${proto}://${host}`;
}

function bounce(req: NextRequest): NextResponse {
  const origin = publicOrigin(req);
  const to = req.nextUrl.searchParams.get("to");

  let target = `${origin}/`;
  if (to) {
    try {
      const u = new URL(to, origin);
      if (u.origin === origin) target = u.toString();
    } catch {
      // malformed `to` - fall back to home
    }
  }

  // 303 forces the follow-up request to be a GET regardless of the inbound
  // method, which is exactly what we want after a POST redirect.
  return NextResponse.redirect(target, 303);
}

export function POST(req: NextRequest): NextResponse {
  return bounce(req);
}

export function GET(req: NextRequest): NextResponse {
  return bounce(req);
}
