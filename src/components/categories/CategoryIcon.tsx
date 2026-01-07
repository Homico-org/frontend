'use client';

interface CategoryIconProps {
  type: string;
  className?: string;
}

/**
 * Unified category icons used across the application.
 * Single source of truth for all category-related icons.
 */
export default function CategoryIcon({ type, className = '' }: CategoryIconProps) {
  switch (type) {
    case 'designer':
    case 'design':
    case 'interior-design':
      // Sofa/Interior design icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M4 22V20C4 18.3431 5.34315 17 7 17H25C26.6569 17 28 18.3431 28 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 17V14C6 12.8954 6.89543 12 8 12H24C25.1046 12 26 12.8954 26 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <rect x="4" y="22" width="24" height="4" rx="1.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 26V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M24 26V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="16" cy="8" r="2" fill="currentColor"/>
        </svg>
      );

    case 'architect':
    case 'architecture':
      // Blueprint/Building icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M6 28V10L16 4L26 10V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 28H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <rect x="10" y="14" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="18" y="14" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13 28V23C13 22.4477 13.4477 22 14 22H18C18.5523 22 19 22.4477 19 23V28" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
        </svg>
      );

    case 'craftsmen':
    case 'crafts':
      // Hammer & wrench icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M7 25L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 27L7 25L9 27L7 29L5 27Z" fill="currentColor"/>
          <path d="M19 7C16.7909 7 15 8.79086 15 11C15 11.7403 15.1928 12.4373 15.5305 13.0427L9.5 19.5L12.5 22.5L18.9573 16.4695C19.5627 16.8072 20.2597 17 21 17C23.2091 17 25 15.2091 25 13C25 12.6712 24.9585 12.3522 24.88 12.047L22 15L19 12L21.953 9.12C21.6478 9.04154 21.3288 9 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M24 20L20 24L22 26L28 20L26 18L24 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );

    case 'homecare':
    case 'home-care':
    case 'home':
      // Home with sparkle icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M5 14L16 5L27 14V26C27 26.5523 26.5523 27 26 27H6C5.44772 27 5 26.5523 5 26V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 27V19C12 18.4477 12.4477 18 13 18H19C19.5523 18 20 18.4477 20 19V27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 8L24 10L26 11L24 12L23 14L22 12L20 11L22 10L23 8Z" fill="currentColor"/>
          <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
        </svg>
      );

    case 'plumbing':
    case 'plumber':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M16 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 10H22V14C22 15.6569 20.6569 17 19 17H13C11.3431 17 10 15.6569 10 14V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M13 17V20C13 21.6569 14.3431 23 16 23C17.6569 23 19 21.6569 19 20V17" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 23V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 28H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );

    case 'painting':
    case 'paint':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M26 4H6C4.89543 4 4 4.89543 4 6V12C4 13.1046 4.89543 14 6 14H26C27.1046 14 28 13.1046 28 12V6C28 4.89543 27.1046 4 26 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M16 14V18" stroke="currentColor" strokeWidth="2"/>
          <path d="M13 18H19V28H13V18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      );

    case 'electrical':
    case 'electrician':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M18 4L10 18H16L14 28L22 14H16L18 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      );

    case 'hvac':
    case 'climate':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 16H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="22" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );

    default:
      // Grid/Services icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <rect x="18" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <rect x="5" y="18" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <rect x="18" y="18" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"/>
          <circle cx="22.5" cy="9.5" r="1.5" fill="currentColor"/>
          <circle cx="9.5" cy="22.5" r="1.5" fill="currentColor"/>
          <circle cx="22.5" cy="22.5" r="1.5" fill="currentColor"/>
        </svg>
      );
  }
}

export type { CategoryIconProps };

