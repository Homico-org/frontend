import { SkeletonListItem } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-3">
      {[...Array(4)].map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}
