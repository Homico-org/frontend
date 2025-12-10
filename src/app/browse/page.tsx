"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BrowsePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/browse/professionals");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
    </div>
  );
}
