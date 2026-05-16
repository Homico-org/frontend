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
  /** TikTok URL */
  tiktokUrl?: string;
  /** Website URL */
  websiteUrl?: string;
  /** Label text */
  label?: string;
  /** Custom className */
  className?: string;
}

// Lucide doesn't ship a TikTok glyph, so we inline the official mark as a
// minimal SVG with `currentColor` fill, sized to match an md-size IconBadge
// (w-10 h-10 outer, w-5 h-5 icon). Public-domain stylized "d + note" path.
function TikTokGlyph() {
  return (
    <span
      className="w-10 h-10 inline-flex items-center justify-center"
      style={{ color: '#010101' }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z" />
      </svg>
    </span>
  );
}

export default function SocialLinks({
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  tiktokUrl,
  websiteUrl,
  label = 'Social',
  className = '',
}: SocialLinksProps) {
  const hasSocialLinks =
    facebookUrl || instagramUrl || linkedinUrl || tiktokUrl || websiteUrl;

  if (!hasSocialLinks) return null;

  return (
    <div
      className={`bg-[var(--hm-bg-elevated)] rounded-2xl p-5 shadow-sm border border-[var(--hm-border-subtle)] ${className}`}
    >
      <h3 className="text-sm font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider mb-3">
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
            <IconBadge icon={Facebook} variant="facebook" size="md" className="rounded-none" />
          </a>
        )}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <IconBadge icon={Instagram} variant="instagram" size="md" className="rounded-none" />
          </a>
        )}
        {tiktokUrl && (
          <a
            href={tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <TikTokGlyph />
          </a>
        )}
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <IconBadge icon={Linkedin} variant="linkedin" size="md" className="rounded-none" />
          </a>
        )}
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
          >
            <IconBadge icon={Globe} variant="neutral" size="md" className="rounded-none" />
          </a>
        )}
      </div>
    </div>
  );
}
