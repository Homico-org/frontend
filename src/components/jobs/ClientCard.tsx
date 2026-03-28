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
  client: ClientInfo;
  label?: string;
  organizationLabel?: string;
  isVisible?: boolean;
  className?: string;
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

  const content = (
    <div className={`flex items-center gap-2.5 ${linkToProfile ? 'group' : ''}`}>
      <Avatar
        src={client.avatar}
        name={client.name}
        size="md"
        className={`w-9 h-9 ${linkToProfile ? 'group-hover:ring-2 group-hover:ring-[#C4735B]/30 transition-all' : ''}`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold text-neutral-900 dark:text-white truncate ${
          linkToProfile ? 'group-hover:text-[#C4735B] transition-colors' : ''
        }`}>
          {displayName}
        </p>
        <div className="flex items-center gap-1.5">
          {client.city && (
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {client.city}
            </span>
          )}
          {client.accountType === 'organization' && (
            <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
              <Building2 className="w-2.5 h-2.5" />
              {organizationLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200/50 dark:border-neutral-800 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      {linkToProfile && client._id ? (
        <Link href={profileUrl}>{content}</Link>
      ) : (
        content
      )}
    </div>
  );
}
