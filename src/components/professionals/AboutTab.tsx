'use client';

import { Badge } from '@/components/ui/badge';
import { SocialIcon, socialColors } from '@/components/icons';
import { Globe } from 'lucide-react';

export interface AboutTabProps {
  /** Profile description */
  description?: string;
  /** Custom services offered */
  customServices?: string[];
  /** Subcategories/skills grouped by category */
  groupedServices: Record<string, string[]>;
  /** Function to get category label */
  getCategoryLabel: (categoryKey: string) => string;
  /** Function to get subcategory label */
  getSubcategoryLabel: (subcategoryKey: string) => string;
  /** WhatsApp number */
  whatsapp?: string;
  /** Telegram username */
  telegram?: string;
  /** Facebook URL */
  facebookUrl?: string;
  /** Instagram URL */
  instagramUrl?: string;
  /** LinkedIn URL */
  linkedinUrl?: string;
  /** Website URL */
  websiteUrl?: string;
  /** Locale for translations */
  locale?: 'en' | 'ka';
}

export default function AboutTab({
  description,
  customServices,
  groupedServices,
  getCategoryLabel,
  getSubcategoryLabel,
  whatsapp,
  telegram,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  websiteUrl,
  locale = 'en',
}: AboutTabProps) {
  const hasContactLinks = whatsapp || telegram || facebookUrl || instagramUrl || linkedinUrl || websiteUrl;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Description */}
      {description && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}

      {/* Services Grid */}
      {customServices && customServices.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
            {locale === 'ka' ? 'სერვისები' : 'Services'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {customServices.map((service, idx) => (
              <Badge key={idx} variant="premium" size="default">
                {service}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Skills by Category */}
      {Object.keys(groupedServices).length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
            {locale === 'ka' ? 'უნარები' : 'Skills'}
          </h3>
          <div className="space-y-4">
            {Object.entries(groupedServices).map(([categoryKey, subcats]) => {
              if (subcats.length === 0) return null;
              return (
                <div key={categoryKey}>
                  <p className="text-xs font-medium text-neutral-400 mb-2">
                    {getCategoryLabel(categoryKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subcats.map((sub, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        {getSubcategoryLabel(sub)}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact & Social Links */}
      {hasContactLinks && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            {locale === 'ka' ? 'კონტაქტი და სოციალური' : 'Contact & Social'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 rounded-full flex items-center justify-center gap-2 hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.whatsapp}15`, color: socialColors.whatsapp }}
              >
                <SocialIcon name="whatsapp" size="md" />
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            )}
            {telegram && (
              <a
                href={`https://t.me/${telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 rounded-full flex items-center justify-center gap-2 hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.telegram}15`, color: socialColors.telegram }}
              >
                <SocialIcon name="telegram" size="md" />
                <span className="text-sm font-medium">Telegram</span>
              </a>
            )}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.facebook}15`, color: socialColors.facebook }}
              >
                <SocialIcon name="facebook" size="md" />
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.instagram}15`, color: socialColors.instagram }}
              >
                <SocialIcon name="instagram" size="md" />
              </a>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.linkedin}15`, color: socialColors.linkedin }}
              >
                <SocialIcon name="linkedin" size="md" />
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

