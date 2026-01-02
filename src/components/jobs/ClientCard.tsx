'use client';

import { Building2, MapPin } from 'lucide-react';
import Avatar from '@/components/common/Avatar';

export interface ClientInfo {
  _id: string;
  name: string;
  avatar?: string;
  city?: string;
  accountType?: 'individual' | 'organization';
  companyName?: string;
}

export interface ClientCardProps {
  /** Client information */
  client: ClientInfo;
  /** Label text */
  label?: string;
  /** Organization label text */
  organizationLabel?: string;
  /** Animation state for entry */
  isVisible?: boolean;
  /** Custom className */
  className?: string;
}

export default function ClientCard({
  client,
  label = 'Client',
  organizationLabel = 'Organization',
  isVisible = true,
  className = '',
}: ClientCardProps) {
  const displayName =
    client.accountType === 'organization'
      ? client.companyName || client.name
      : client.name;

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      <h3 className="font-display text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
        {label}
      </h3>
      <div className="flex items-center gap-4 mb-4">
        <Avatar
          src={client.avatar}
          name={client.name}
          size="lg"
          className="w-14 h-14 ring-2 ring-neutral-100 dark:ring-neutral-800"
        />
        <div className="min-w-0">
          <p className="font-body font-semibold text-neutral-900 dark:text-white truncate">
            {displayName}
          </p>
          {client.city && (
            <p className="font-body text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {client.city}
            </p>
          )}
        </div>
      </div>
      {client.accountType === 'organization' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
          <Building2 className="w-4 h-4 text-neutral-400" />
          <span className="font-body text-xs text-neutral-500 dark:text-neutral-400">
            {organizationLabel}
          </span>
        </div>
      )}
    </div>
  );
}
