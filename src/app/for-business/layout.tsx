import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Business — Homico',
  description: 'Professional home services for your business. Get access to vetted, top-rated professionals managed by Homico.',
};

export default function ForBusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
