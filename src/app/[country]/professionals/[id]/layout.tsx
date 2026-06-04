import { Metadata } from 'next';
import MobileBottomNav from '@/components/common/MobileBottomNav';

interface Props {
  // The pro page lives under `[country]` so we receive the marketplace
  // segment alongside the pro id. Used to build a country-prefixed
  // canonical URL and resolve the right OG locale.
  params: Promise<{ country: string; id: string }>;
}

// OG locale per marketplace - matches the metadata table in
// `app/[country]/layout.tsx`. Falls back to ka_GE for unknown codes
// so an old cached URL still emits valid metadata.
const OG_LOCALE_BY_COUNTRY: Record<string, string> = {
  GE: 'ka_GE',
  IL: 'he_IL',
  FR: 'fr_FR',
  US: 'en_US',
  DE: 'de_DE',
  UK: 'en_GB',
};

// Category translations for OG description
const categoryTranslations: Record<string, { en: string; ka: string }> = {
  'design': { en: 'Design', ka: 'დიზაინი' },
  'architecture': { en: 'Architecture', ka: 'არქიტექტურა' },
  'construction': { en: 'Construction', ka: 'მშენებლობა' },
  'renovation': { en: 'Renovation', ka: 'რემონტი' },
  'plumbing': { en: 'Plumbing', ka: 'სანტექნიკა' },
  'electrical': { en: 'Electrical', ka: 'ელექტრობა' },
  'hvac': { en: 'HVAC', ka: 'კონდიცირება' },
  'flooring': { en: 'Flooring', ka: 'იატაკი' },
  'painting': { en: 'Painting', ka: 'მხატვრობა' },
  'roofing': { en: 'Roofing', ka: 'სახურავი' },
  'landscaping': { en: 'Landscaping', ka: 'ლანდშაფტი' },
  'cleaning': { en: 'Cleaning', ka: 'დასუფთავება' },
  'moving': { en: 'Moving', ka: 'გადაზიდვა' },
  'furniture': { en: 'Furniture', ka: 'ავეჯი' },
  'appliances': { en: 'Appliances', ka: 'ტექნიკა' },
  'windows-doors': { en: 'Windows & Doors', ka: 'ფანჯარა-კარები' },
  'security': { en: 'Security', ka: 'უსაფრთხოება' },
  'smart-home': { en: 'Smart Home', ka: 'ჭკვიანი სახლი' },
};

async function getProProfile(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/users/pros/${id}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function getImageUrl(path: string | undefined, forOG = false): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // For OG images, ensure we use the public API URL. Falls back to the
  // legacy api.homico.ge host when no override is configured so existing
  // production deploys keep working without env changes.
  const baseUrl = forOG
    ? process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'https://api.homico.ge'
    : apiUrl;
  if (path.startsWith('/')) return `${baseUrl}${path}`;
  return `${baseUrl}/uploads/${path}`;
}

function getCategoryLabels(categories: string[] | undefined): string {
  if (!categories || categories.length === 0) return '';
  return categories
    .map(cat => categoryTranslations[cat]?.ka || cat)
    .join(', ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, id } = await params;
  const profile = await getProProfile(id);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://homico.co';
  const seg = country.toLowerCase();
  const pageUrl = `${siteUrl}/${seg}/professionals/${id}`;
  const defaultImage = `${siteUrl}/og-image.png`;
  const ogLocale = OG_LOCALE_BY_COUNTRY[country.toUpperCase()] || 'ka_GE';

  if (!profile) {
    return {
      title: 'პროფესიონალი | Homico',
      description: 'იპოვე საუკეთესო პროფესიონალები',
      openGraph: {
        title: 'პროფესიონალი | Homico',
        description: 'იპოვე საუკეთესო პროფესიონალები',
        url: pageUrl,
        siteName: 'Homico',
        type: 'website',
        images: [{ url: defaultImage, width: 1200, height: 630, alt: 'Homico' }],
        locale: ogLocale,
      },
    };
  }

  const categoryLabels = getCategoryLabels(profile.categories);
  const title = `${profile.name} - ${profile.title || 'პროფესიონალი'} | Homico`;

  // Build a rich description with categories and stats
  let descriptionParts: string[] = [];
  if (profile.title) descriptionParts.push(profile.title);
  if (categoryLabels) descriptionParts.push(categoryLabels);
  if (profile.avgRating > 0) descriptionParts.push(`${profile.avgRating.toFixed(1)}★ (${profile.totalReviews || 0} შეფასება)`);
  if (profile.yearsExperience) descriptionParts.push(`${profile.yearsExperience}+ წლის გამოცდილება`);
  if (profile.serviceAreas?.[0]) descriptionParts.push(profile.serviceAreas[0]);

  const description = descriptionParts.length > 0
    ? descriptionParts.join(' | ')
    : (profile.bio ? profile.bio.slice(0, 160) : `${profile.name} - პროფესიონალი Homico-ზე`);

  // Use avatar for OG image, with absolute URL
  const avatarUrl = getImageUrl(profile.avatar, true);
  const ogImage = avatarUrl || defaultImage;

  return {
    title,
    description,
    openGraph: {
      title: `${profile.name} | ${profile.title || 'პროფესიონალი'}`,
      description,
      url: pageUrl,
      siteName: 'Homico',
      type: 'profile',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: profile.name,
        },
      ],
      locale: ogLocale,
    },
    twitter: {
      card: 'summary',
      title: `${profile.name} | Homico`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'fb:app_id': process.env.NEXT_PUBLIC_FB_APP_ID || '',
    },
  };
}

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <MobileBottomNav />
    </>
  );
}
