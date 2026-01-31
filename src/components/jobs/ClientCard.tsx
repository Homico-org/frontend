'use client';

import { Building2, MapPin } from 'lucide-react';
import Link from 'next/link';
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
  /** Whether to make the card clickable to user profile */
  linkToProfile?: boolean;
}

export default function ClientCard({
  client,
  label = 'Client',
  organizationLabel = 'Organization',
  isVisible = true,
  className = '',
  linkToProfile = true,
}: ClientCardProps) {
  const displayName =
    client.accountType === 'organization'
      ? client.companyName || client.name
      : client.name;

  const profileUrl = `/users/${client._id}`;

  const AvatarAndName = (
    <div className={`flex items-center gap-3 sm:gap-4 ${linkToProfile ? 'group cursor-pointer' : ''}`}>
      <Avatar
        src={client.avatar}
        name={client.name}
        size="lg"
        className={`w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-neutral-100 dark:ring-neutral-800 ${
          linkToProfile ? 'group-hover:ring-[#C4735B]/50 transition-all' : ''
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className={`font-body font-semibold text-sm sm:text-base text-neutral-900 dark:text-white truncate ${
          linkToProfile ? 'group-hover:text-[#C4735B] transition-colors' : ''
        }`}>
          {displayName}
        </p>
        {client.city && (
          <p className="font-body text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {client.city}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-700 delay-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      <h3 className="font-display text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 sm:mb-4">
        {label}
      </h3>
      <div className="mb-3 sm:mb-4">
        {linkToProfile && client._id ? (
          <Link href={profileUrl}>
            {AvatarAndName}
          </Link>
        ) : (
          AvatarAndName
        )}
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
