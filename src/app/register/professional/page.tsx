'use client';

import { Suspense } from 'react';
import ProRegistration from '@/components/register/ProRegistration';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

function ProRegisterContent() {
  const router = useRouter();

  return (
    <ProRegistration
      onSwitchToClient={() => router.push('/register')}
    />
  );
}

export default function ProRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <LoadingSpinner size="xl" variant="border" color="#C4735B" />
        </div>
      }
    >
      <ProRegisterContent />
    </Suspense>
  );
}
