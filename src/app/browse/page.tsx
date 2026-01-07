"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function BrowsePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const isPro = user?.role === "pro" || user?.role === "admin";
      if (isPro) {
        router.replace("/browse/jobs");
      } else {
        router.replace("/browse/portfolio");
      }
    }
  }, [router, user, isLoading]);

  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" color="#C4735B" />
    </div>
  );
}
