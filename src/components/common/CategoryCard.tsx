import Link from 'next/link';

interface CategoryCardProps {
  name: string;
  icon: string;
  slug: string;
  count?: string;
}

export default function CategoryCard({ name, icon, slug, count }: CategoryCardProps) {
  return (
    <Link href={`/browse?category=${slug}`} className="group">
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-5 text-center hover:border-blue-300 dark:hover:border-primary-400 hover:shadow-sm dark:hover:shadow-none transition-all duration-200 ease-out">
        {/* Icon */}
        <div className="text-4xl mb-3 transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>

        {/* Category name */}
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1 group-hover:text-blue-600 dark:group-hover:text-primary-400 transition-all duration-200 ease-out">
          {name}
        </h3>

        {/* Pro count */}
        {count && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {count}
          </p>
        )}

        {/* Arrow indicator */}
        <div className="mt-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
