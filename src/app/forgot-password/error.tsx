'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ForgotPasswordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Forgot password error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
      <Card variant="glass" size="xl" className="w-full max-w-[440px] shadow-xl">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <IconBadge icon={AlertTriangle} variant="error" size="xl" />
        </div>

        {/* Title */}
        <h2 className="text-[26px] font-bold text-center text-neutral-900 dark:text-white mb-2">
          Something went wrong
        </h2>

        {/* Subtitle */}
        <p className="text-center text-neutral-500 dark:text-neutral-400 text-[15px] mb-8">
          An unexpected error occurred. Please try again or start over.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={() => {
              try {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('resetPhone');
                }
              } catch {
                // Ignore sessionStorage errors
              }
              router.push('/forgot-password');
            }}
            size="lg"
            className="w-full"
          >
            Start Over
          </Button>
        </div>

        {/* Back to home */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          <Button
            variant="link"
            onClick={() => router.push('/')}
            className="p-0 h-auto"
          >
            Return to Home
          </Button>
        </p>
      </Card>
    </div>
  );
}
