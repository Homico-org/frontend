import { LoadingSpinnerCentered } from "@/components/ui/LoadingSpinner";

/**
 * Per-route loading boundary so /jobs nav-in doesn't flash blank
 * before the server component resolves. Sits inside the shell
 * layout so the header / sidebar / mobile-nav stay put while only
 * the list area shows a spinner.
 */
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinnerCentered />
    </div>
  );
}
