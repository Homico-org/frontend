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
function bounce(req: NextRequest): NextResponse {
  const origin = req.nextUrl.origin;
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
