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

    case 'cleaning':
      // Broom/sparkle icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M12 4L16 12L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 12H22V16C22 18 20 20 16 20C12 20 10 18 10 16V12Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 20V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="8" cy="8" r="1" fill="currentColor"/>
        </svg>
      );

    case 'handyman':
    case 'renovation':
      // Wrench icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M7 25L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 27L7 25L9 27L7 29L5 27Z" fill="currentColor"/>
          <path d="M19 7C16.79 7 15 8.79 15 11C15 11.74 15.19 12.44 15.53 13.04L9.5 19.5L12.5 22.5L18.96 16.47C19.56 16.81 20.26 17 21 17C23.21 17 25 15.21 25 13C25 12.67 24.96 12.35 24.88 12.05L22 15L19 12L21.95 9.12C21.65 9.04 21.33 9 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );

    case 'appliance':
      // Washing machine icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="16" cy="18" r="5" stroke="currentColor" strokeWidth="2"/>
          <circle cx="16" cy="18" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="11" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
        </svg>
      );

    case 'doors_locks':
      // Door icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="8" y="4" width="16" height="24" rx="1" stroke="currentColor" strokeWidth="2"/>
          <circle cx="20" cy="16" r="1.5" fill="currentColor"/>
          <path d="M20 16V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case 'furniture':
      // Chair icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M10 14V8C10 6.89 10.89 6 12 6H20C21.1 6 22 6.89 22 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 14H24V20C24 21.1 23.1 22 22 22H10C8.9 22 8 21.1 8 20V14Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 22V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 22V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );

    case 'chemical_cleaning':
      // Spray bottle icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M14 10H18V8H20L22 6H18V4H14V6H10L12 8H14V10Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <rect x="12" y="10" width="8" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M14 14H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="24" cy="10" r="1" fill="currentColor"/>
          <circle cx="26" cy="8" r="0.75" fill="currentColor"/>
        </svg>
      );

    case 'it_services':
      // Computer icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 26H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 22V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="16" cy="14" r="3" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );

    case 'heavy_lifting':
      // Truck icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="2" y="10" width="18" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 14H26L30 18V22H20V14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="9" cy="24" r="2.5" stroke="currentColor" strokeWidth="2"/>
          <circle cx="25" cy="24" r="2.5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );

    case 'hvac':
    case 'climate':
    case 'heating_cooling':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 16H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="22" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );

    case 'carpenter':
      // Saw icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M6 22L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 6L26 10L10 26L6 22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M10 14L18 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3"/>
          <rect x="4" y="24" width="6" height="4" rx="1" transform="rotate(-45 4 24)" fill="currentColor" opacity="0.3"/>
        </svg>
      );

    case 'builder':
      // Hard hat / construction icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M8 18C8 13.5817 11.5817 10 16 10C20.4183 10 24 13.5817 24 18" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 18H26V21C26 22.1046 25.1046 23 24 23H8C6.89543 23 6 22.1046 6 21V18Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M14 10V7H18V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 27H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 23V27" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M20 23V27" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );

    case 'painter':
    case 'paint':
      // Paint roller icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="6" y="6" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M24 10H26V14H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 14V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <rect x="15" y="18" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );

    case 'tiler':
      // Tile grid icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="5" y="5" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="17" y="5" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="5" y="17" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="17" y="17" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 8V12M8 10H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        </svg>
      );

    case 'flooring':
      // Floor planks icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 13H28" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 20H28" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M16 6V13" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 13V20" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M22 13V20" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M16 20V26" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );

    case 'ceiling':
      // Ceiling with light icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M4 8H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M26 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 13L16 13L20 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M11 17L16 25L21 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="16" cy="15" r="2" fill="currentColor" opacity="0.3"/>
        </svg>
      );

    case 'metalworker':
      // Welding / anvil icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M8 24H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 24V20C10 18.8954 10.8954 18 12 18H20C21.1046 18 22 18.8954 22 20V24" stroke="currentColor" strokeWidth="2"/>
          <path d="M14 18V14L10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 18V14L22 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="16" cy="12" r="2" fill="currentColor"/>
          <path d="M14 8H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case 'roofer':
      // Roof icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M4 18L16 8L28 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16V26H25V16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <rect x="13" y="20" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 18L2 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M28 18L30 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case 'glass_mirror':
      // Window/glass pane icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="6" y="6" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 6V26" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 16H26" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 9L13 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
          <path d="M19 9L23 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
        </svg>
      );

    case 'systems':
      // Camera/security icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="10" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 14L27 10V22L20 18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="12" cy="16" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
          <path d="M8 26H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        </svg>
      );

    case 'cleaner':
      // Spray bottle icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="10" y="12" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 12V9C12 8.44772 12.4477 8 13 8H17C17.5523 8 18 8.44772 18 9V12" stroke="currentColor" strokeWidth="2"/>
          <path d="M15 8V5H18L22 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M13 20H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case 'gardener':
      // Tree/plant icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M16 28V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 18C16 18 10 16 10 11C10 7 13 5 16 5C19 5 22 7 22 11C22 16 16 18 16 18Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 20C9 19 7 17 8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M20 20C23 19 25 17 24 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 28H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );

    case 'stone_worker':
      // Stone/chisel icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M6 20L12 14L18 20L12 26Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M12 14L20 6L26 12L18 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M14 18L18 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          <path d="M8 28H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );

    case 'it_specialist':
      // Monitor/computer icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 22H20V25H12Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 25H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="21" cy="13" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );

    case 'mover':
      // Truck icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="3" y="10" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M19 14H24L28 18V22H19V14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="9" cy="24" r="2.5" stroke="currentColor" strokeWidth="2"/>
          <circle cx="24" cy="24" r="2.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M11.5 22H19" stroke="currentColor" strokeWidth="1.5"/>
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

