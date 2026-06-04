import { redirect } from "next/navigation";

/**
 * There's no standalone booking-detail page (the bookings list renders detail
 * inline, and per-booking deep links go to the pay flow). A bare
 * /bookings/{id} link (from a notification, a cl()-wrapped link, or a stale
 * URL) used to 404. Route it to this booking's pay page, which shows the
 * booking summary and either the pay/retry step or an "already paid" state.
 */
export default function BookingDetailRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/bookings/${params.id}/pay`);
}
