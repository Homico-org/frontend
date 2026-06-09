"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Beaker, CheckCircle2, XOctagon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Dev-only simulated payment page. Stands in for the BoG / TBC / Stripe
 * hosted page when PAYMENT_PROVIDER=mock. Two buttons let you exercise
 * both happy path and failure path without touching a real bank.
 *
 * On click, POSTs to /payments/webhooks/mock with the intent id so the
 * backend transitions the Payment row, then redirects to the standard
 * return URL where the booking-side reconcile happens.
 *
 * Will be rendered ONLY in dev environments since the mock provider is
 * refused in production by the factory (see PaymentProviderFactory).
 * The page itself doesn't gate on env - if you somehow land here in prod
 * the POST will 404 because no mock provider is registered.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function MockConfirmPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id;
  const intentId = searchParams.get("intent");

  const [posting, setPosting] = useState<"none" | "success" | "failure">("none");
  const [error, setError] = useState<string | null>(null);

  const simulate = useCallback(
    async (outcome: "success" | "failure") => {
      if (!intentId) {
        setError("Missing intent id");
        return;
      }
      setPosting(outcome);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/payments/webhooks/mock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intentId, outcome }),
        });
        if (!res.ok) {
          throw new Error(`Webhook returned ${res.status}`);
        }
        // Standard return-URL flow.
        router.push(`/bookings/${bookingId}/pay/return`);
      } catch (err) {
        setError((err as Error).message);
        setPosting("none");
      }
    },
    [intentId, router, bookingId],
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--hm-bg-page)" }}
    >
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Beaker size={20} style={{ color: "#A855F7" }} />
            <CardTitle>Mock Payment Provider</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <Alert variant="warning" className="mb-5">
            This is a simulated payment page for local development. No real
            money moves. The real provider (BoG / TBC) replaces this when
            PAYMENT_PROVIDER is set to a real value.
          </Alert>

          <div className="space-y-3 mb-5">
            <p
              className="text-sm"
              style={{ color: "var(--hm-text-secondary)" }}
            >
              Intent: <code className="text-xs">{intentId ?? "?"}</code>
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--hm-text-secondary)" }}
            >
              Booking: <code className="text-xs">{bookingId}</code>
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="success"
              onClick={() => simulate("success")}
              disabled={posting !== "none"}
            >
              {posting === "success" ? (
                <LoadingSpinner size="sm" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Simulate successful payment
            </Button>
            <Button
              variant="destructive"
              onClick={() => simulate("failure")}
              disabled={posting !== "none"}
            >
              {posting === "failure" ? (
                <LoadingSpinner size="sm" />
              ) : (
                <XOctagon size={16} />
              )}
              Simulate failed payment
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push(`/bookings/${bookingId}/pay`)}
              disabled={posting !== "none"}
            >
              Cancel and go back
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
