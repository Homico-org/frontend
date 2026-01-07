'use client';

import { Facebook, Instagram, Linkedin, Globe } from 'lucide-react';
import { IconBadge } from '@/components/ui/IconBadge';

export interface SocialLinksProps {
  /** Facebook URL */
  facebookUrl?: string;
  /** Instagram URL */
  instagramUrl?: string;
  /** LinkedIn URL */
  linkedinUrl?: string;
  /** Website URL */
  websiteUrl?: string;
  /** Label text */
  label?: string;
  /** Custom className */
  className?: string;
}

export default function SocialLinks({
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  websiteUrl,
  label = 'Social',
  className = '',
}: SocialLinksProps) {
  const hasSocialLinks = facebookUrl || instagramUrl || linkedinUrl || websiteUrl;

  if (!hasSocialLinks) return null;

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 ${className}`}
    >
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">
        {facebookUrl && (
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <IconBadge icon={Facebook} variant="facebook" size="md" />
          </a>
        )}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <IconBadge icon={Instagram} variant="instagram" size="md" />
          </a>
        )}
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <IconBadge icon={Linkedin} variant="linkedin" size="md" />
          </a>
        )}
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
          >
            <IconBadge icon={Globe} variant="neutral" size="md" />
          </a>
        )}
      </div>
    </div>
  );
}
