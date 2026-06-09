import { LoadingSpinnerCentered } from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinnerCentered />
    </div>
  );
}
