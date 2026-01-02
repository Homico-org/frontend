import Link from 'next/link';

// Professional category icons
const CategoryIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  const iconClass = `${className}`;

  switch (type) {
    case 'design':
    case 'designer':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L2 12H5V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V12H22L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <rect x="9" y="12" width="6" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="6" r="1" fill="currentColor"/>
        </svg>
      );
    case 'architecture':
    case 'architect':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 21V8L12 3L19 8V21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 21V15H15V21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'craftsmen':
    case 'crafts':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M14.7 6.3C14.3 5.5 13.5 5 12.6 5C11.2 5 10 6.2 10 7.6C10 8 10.1 8.4 10.3 8.7L5 14L7 16L12.3 10.7C12.6 10.9 13 11 13.4 11C14.8 11 16 9.8 16 8.4C16 8 15.9 7.6 15.7 7.3L14 9L12 7L14.7 6.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M5 14L3 19L8 17L5 14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
      );
    case 'homecare':
    case 'home':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M3 11L12 4L21 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 10V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 13V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'landscaping':
    case 'garden':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M12 21C12 21 5 16 5 11C5 7.13 8.13 4 12 4C15.87 4 19 7.13 19 11C19 16 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 11V21" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 14L12 11L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'electrical':
    case 'electric':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M13 2L4 14H11L10 22L19 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case 'plumbing':
    case 'plumber':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M12 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 7H16V10C16 11.1 15.1 12 14 12H10C8.9 12 8 11.1 8 10V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 12V14C10 15.1 10.9 16 12 16C13.1 16 14 15.1 14 14V12" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 16V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 21H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'painting':
    case 'paint':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V9C3 10.1 3.9 11 5 11H19C20.1 11 21 10.1 21 9V5C21 3.9 20.1 3 19 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 11V14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 14H14V21H10V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    default:
      // Default grid/category icon
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
  }
};

interface CategoryCardProps {
  name: string;
  icon: string;
  slug: string;
  count?: string;
}

export default function CategoryCard({ name, icon, slug, count }: CategoryCardProps) {
  return (
    <Link href={`/browse?category=${slug}`} className="group block">
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
