import { CategoryIcon } from '@/components/categories';
import Link from 'next/link';

interface CategoryCardProps {
  name: string;
  icon: string;
  slug: string;
  count?: string;
}

export default function CategoryCard({ name, icon, slug, count }: CategoryCardProps) {
  return (
    <Link href={`/professionals?category=${slug}`} className="group block">
      <div className="relative bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:shadow-neutral-200/50 hover:border-[var(--hm-brand-500)]/30 hover:-translate-y-0.5">
        {/* Gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-brand-500)]/5 via-transparent to-[var(--hm-brand-500)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative p-6 flex flex-col items-center text-center">
          {/* Icon container with subtle background */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-[var(--hm-brand-500)]/10 rounded-xl blur-xl scale-150 opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="relative w-14 h-14 flex items-center justify-center rounded-xl bg-[var(--hm-bg-tertiary)]/50 group-hover:bg-[var(--hm-brand-500)]/10 transition-all duration-300">
              <CategoryIcon
                type={slug}
                className="w-7 h-7 text-[var(--hm-fg-secondary)] group-hover:text-[var(--hm-brand-500)] transition-colors duration-300"
              />
            </div>
          </div>

          {/* Category name */}
          <h3 className="text-sm font-semibold text-[var(--hm-fg-primary)] group-hover:text-[var(--hm-brand-500)] transition-colors duration-300 mb-1">
            {name}
          </h3>

          {/* Pro count */}
          {count && (
            <p className="text-xs text-[var(--hm-fg-muted)]0">
              {count}
            </p>
          )}

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[var(--hm-brand-500)]/60 via-[var(--hm-brand-500)] to-[var(--hm-brand-500)]/60 group-hover:w-3/4 transition-all duration-300 rounded-full" />
        </div>
      </div>
    </Link>
  );
}
