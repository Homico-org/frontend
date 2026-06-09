'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Package, ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Props {
  label: string;
  isCollapsed: boolean;
  active: boolean;
}

/**
 * Sidebar "Shop" item as a collapsible group with static children
 * (Catalog, Orders, ...). Mirrors the Projects tree styling; expands when
 * you're anywhere in the shop section.
 */
export default function SidebarShopGroup({ label, isCollapsed, active }: Props) {
  const pathname = usePathname() || '';
  const { t } = useLanguage();
  const inSection =
    /\/shop(\/|$)/.test(pathname) || /\/orders(\/|$)/.test(pathname);
  const [expanded, setExpanded] = useState(inSection);

  // Follow the section: expand on entry, collapse on leave (manual toggles
  // within the section persist).
  useEffect(() => {
    setExpanded(inSection);
  }, [inSection]);

  const children = [
    {
      href: '/shop',
      label: t('nav.shopCatalog'),
      Icon: Store,
      isCurrent: /\/shop(\/|$)/.test(pathname),
    },
    {
      href: '/orders',
      label: t('header.orders'),
      Icon: Package,
      isCurrent: /\/orders(\/|$)/.test(pathname),
    },
  ];

  if (isCollapsed) {
    return (
      <Link
        href="/shop"
        title={label}
        className={`relative flex items-center justify-center rounded-xl px-2 py-2 text-[12.5px] transition-colors ${
          active
            ? 'bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]'
            : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]'
        }`}
      >
        <ShoppingBag
          className="h-[18px] w-[18px] flex-shrink-0"
          strokeWidth={active ? 2.1 : 1.75}
        />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] transition-colors ${
          active
            ? 'bg-[var(--hm-brand-500)]/[0.10] font-semibold text-[var(--hm-brand-500)]'
            : 'font-medium text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]'
        }`}
      >
        <ShoppingBag
          className="h-[18px] w-[18px] flex-shrink-0"
          strokeWidth={active ? 2.1 : 1.75}
        />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            expanded ? '' : '-rotate-90'
          } ${active ? 'text-[var(--hm-brand-500)]' : 'text-[var(--hm-fg-muted)]'}`}
        />
      </button>

      {expanded && (
        <div className="relative ml-[19px] mt-1 space-y-0.5 pl-3 before:absolute before:left-0 before:top-0 before:bottom-2 before:w-px before:bg-[var(--hm-border-subtle)]">
          {children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
                c.isCurrent
                  ? 'bg-[var(--hm-brand-500)]/[0.08] font-semibold text-[var(--hm-brand-500)]'
                  : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]'
              }`}
            >
              <c.Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
              <span className="truncate">{c.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
