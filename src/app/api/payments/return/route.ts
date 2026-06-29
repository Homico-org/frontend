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
 * Open-redirect guard: only absolute URLs on a known Homico domain are honoured.
 * We validate the destination directly rather than comparing against our own
 * origin: behind Render's proxy `req.nextUrl.origin` is the internal
 * `http://localhost:10000`, so an origin-based guard rejected the real return
 * URL and bounced the user to a dead localhost page after paying. The `to`
 * value is built server-side from FRONTEND_URL, so it is always one of our
 * domains in practice.
 */
function trustedTarget(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const h = u.hostname;
    const ok =
      h === "homico.ge" ||
      h === "homico.co" ||
      h.endsWith(".homico.ge") ||
      h.endsWith(".homico.co") ||
      h === "localhost"; // local dev (FRONTEND_URL=http://localhost:3000)
    return ok ? u.toString() : null;
  } catch {
    return null;
  }
}

function bounce(req: NextRequest): NextResponse {
  const target = trustedTarget(req.nextUrl.searchParams.get("to"));
  if (target) {
    // 303 forces the follow-up request to be a GET regardless of the inbound
    // method, which is exactly what we want after a POST redirect.
    return NextResponse.redirect(target, 303);
  }
  // Missing / untrusted target: send the browser to the site root. A RELATIVE
  // Location resolves against the address-bar URL (the public domain), so it
  // avoids the internal localhost:10000 origin Next.js sees behind the proxy.
  return new NextResponse(null, { status: 303, headers: { Location: "/" } });
}

export function POST(req: NextRequest): NextResponse {
  return bounce(req);
}

export function GET(req: NextRequest): NextResponse {
  return bounce(req);
}
