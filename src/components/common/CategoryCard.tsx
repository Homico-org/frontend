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
      <div className="relative bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-none hover:border-[#C4735B]/30 dark:hover:border-[#C4735B]/40 hover:-translate-y-0.5">
        {/* Gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B]/5 via-transparent to-[#C4735B]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative p-6 flex flex-col items-center text-center">
          {/* Icon container with subtle background */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-[#C4735B]/10 rounded-xl blur-xl scale-150 opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="relative w-14 h-14 flex items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-800/50 group-hover:bg-[#C4735B]/10 dark:group-hover:bg-[#C4735B]/20 transition-all duration-300">
              <CategoryIcon
                type={slug}
                className="w-7 h-7 text-neutral-600 dark:text-neutral-400 group-hover:text-[#C4735B] transition-colors duration-300"
              />
            </div>
          </div>

          {/* Category name */}
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-[#C4735B] transition-colors duration-300 mb-1">
            {name}
          </h3>

          {/* Pro count */}
          {count && (
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              {count}
            </p>
          )}

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#C4735B]/60 via-[#C4735B] to-[#C4735B]/60 group-hover:w-3/4 transition-all duration-300 rounded-full" />
        </div>
      </div>
    </Link>
  );
}
