import { SkeletonProCardGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <SkeletonProCardGrid count={6} />
    </div>
  );
}
