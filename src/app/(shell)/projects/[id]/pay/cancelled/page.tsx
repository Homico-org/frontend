'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Funding was cancelled at the gateway - bounce back to the project. */
export default function MilestonePaymentCancelledPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = String(params?.id || '');
  useEffect(() => {
    router.replace(`/projects/${projectId}?tab=team`);
  }, [projectId, router]);
  return null;
}
