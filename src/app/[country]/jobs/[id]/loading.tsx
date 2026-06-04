import { LoadingSpinnerCentered } from "@/components/ui/LoadingSpinner";

/**
 * Loading boundary for the heaviest detail page in the app.
 * JobDetailClient is ~3.5k lines and renders a lot of conditional
 * state; without this, route nav-in flashed the previous page
 * for a noticeable beat before the swap.
 */
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinnerCentered />
    </div>
  );
}
